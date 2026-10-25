import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, RotateCcw, Layers } from "lucide-react";
import { BORDERS, CITIES, H, LAND, REGION_VIEW, STATE_LABELS, W, contourPaths, proj, seeded, toPath, LON0, LAT1 } from "@/lib/firewatch/geo";
import { SEV_LABEL, SEV_ORDER, SEV_VAR, type Region, type ScoredAlert } from "@/lib/firewatch/data";
import { cn } from "@/lib/utils";

const CONTOURS = contourPaths();
const LAND_D = toPath(LAND, true);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

interface Props {
  alerts: ScoredAlert[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  region: Region;
  className?: string;
  caption?: string;
}

export function FireMap({ alerts, selectedId, onSelect, region, className, caption }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const initial = (): { z: number; tx: number; ty: number } => { const v = REGION_VIEW[region]; const [x, y] = proj(v.lon, v.lat); return { z: v.z, tx: W / 2 - x * v.z, ty: H / 2 - y * v.z }; };
  const [view, setView] = useState(initial);
  const viewRef = useRef(view);
  viewRef.current = view;
  const [layers, setLayers] = useState({ detections: true, risk: true, weather: false });
  const [showLayers, setShowLayers] = useState(false);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  useEffect(() => { setView(initial()); }, [region]); // eslint-disable-line react-hooks/exhaustive-deps

  const toSvg = (cx: number, cy: number) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint(); pt.x = cx; pt.y = cy;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: p.x, y: p.y };
  };
  const zoomAt = (px: number, py: number, factor: number) => {
    setView((v) => {
      const z = clamp(v.z * factor, 1, 9); const k = z / v.z;
      return { z, tx: px - (px - v.tx) * k, ty: py - (py - v.ty) * k };
    });
  };
  useEffect(() => {
    const el = svgRef.current; if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const p = toSvg(e.clientX, e.clientY);
      zoomAt(p.x, p.y, Math.exp(-dy * 0.0018));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const { z, tx, ty } = view;

  // Greedy screen-space clustering at low zoom.
  const groups = useMemo(() => {
    const thr = 30 / z;
    const out: { x: number; y: number; items: ScoredAlert[] }[] = [];
    const sorted = [...alerts].sort((a, b) => b.probability - a.probability);
    for (const a of sorted) {
      const [x, y] = proj(a.lon, a.lat);
      const g = z < 2.4 ? out.find((g) => Math.hypot(g.x - x, g.y - y) < thr) : undefined;
      if (g) g.items.push(a); else out.push({ x, y, items: [a] });
    }
    return out;
  }, [alerts, z]);

  const detectionDots = useMemo(() => alerts.flatMap((a) => {
    const r = seeded(parseInt(a.id.slice(-3)) * 31 + a.detections);
    return Array.from({ length: a.detections }, () => { const [x, y] = proj(a.lon + (r() - 0.5) * 0.35, a.lat + (r() - 0.5) * 0.26); return { x, y, s: a.severity }; });
  }), [alerts]);

  const wind = useMemo(() => {
    const out: { x: number; y: number; a: number; m: number }[] = [];
    for (let lon = -126; lon <= -110; lon += 1.5) for (let lat = 32.5; lat <= 49; lat += 1.5) {
      const ang = 200 + 50 * Math.sin(lat * 0.5) + 30 * Math.cos(lon * 0.4);
      const [x, y] = proj(lon, lat); out.push({ x, y, a: ang, m: 0.6 + 0.4 * Math.abs(Math.sin(lon + lat)) });
    }
    return out;
  }, []);

  const graticule = useMemo(() => {
    const d: string[] = [];
    for (let lon = -140; lon <= -104; lon += 2) { const [x] = proj(lon, 0); d.push(`M${x},0V${H}`); }
    for (let lat = 32; lat <= 50; lat += 2) { const [, y] = proj(LON0, lat); d.push(`M0,${y}H${W}`); }
    return d.join("");
  }, []);

  const sel = alerts.find((a) => a.id === selectedId);
  const inv = 1 / z;

  return (
    <div className={cn("relative overflow-hidden rounded-md border bg-map-ocean select-none", className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY, moved: false }; }}
        onPointerMove={(e) => {
          const d = drag.current; if (!d) return;
          const ctm = svgRef.current!.getScreenCTM()!;
          const dx = (e.clientX - d.x) / ctm.a, dy = (e.clientY - d.y) / ctm.d;
          if (Math.abs(dx) + Math.abs(dy) > 1) d.moved = true;
          d.x = e.clientX; d.y = e.clientY;
          setView((v) => ({ ...v, tx: v.tx + dx, ty: v.ty + dy }));
        }}
        onPointerUp={() => { setTimeout(() => (drag.current = null), 0); }}
        onPointerLeave={() => (drag.current = null)}
      >
        <defs>
          <clipPath id="land"><path d={LAND_D} /></clipPath>
          <radialGradient id="glow" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="var(--signal)" stopOpacity="0.07" />
            <stop offset="100%" stopColor="var(--signal)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="heat">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.45" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g transform={`translate(${tx} ${ty}) scale(${z})`}>
          <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="var(--map-ocean)" />
          <path d={graticule} stroke="var(--map-line)" strokeOpacity={0.22} strokeWidth={0.6 * inv} fill="none" strokeDasharray={`${2 * inv} ${3 * inv}`} />
          <path d={LAND_D} fill="var(--map-land)" />
          <g clipPath="url(#land)">
            {CONTOURS.map((d, i) => <path key={i} d={d} fill="none" stroke="var(--map-line)" strokeOpacity={0.38} strokeWidth={0.6 * inv} />)}
          </g>
          {/* coastline glow */}
          <path d={LAND_D} fill="none" stroke="var(--signal)" strokeOpacity={0.12} strokeWidth={4 * inv} />
          <path d={LAND_D} fill="none" stroke="var(--map-line)" strokeWidth={0.9 * inv} />
          {BORDERS.map((b, i) => (
            <path key={i} d={toPath(b.pts)} fill="none" stroke="var(--map-line)" strokeOpacity={b.major ? 0.9 : 0.65} strokeWidth={(b.major ? 1 : 0.7) * inv} strokeDasharray={b.major ? undefined : `${4 * inv} ${2.5 * inv}`} />
          ))}
          <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="url(#glow)" pointerEvents="none" />

          {STATE_LABELS.map((l) => { const [x, y] = proj(l.lon, l.lat); return (
            <text key={l.t} x={x} y={y} textAnchor="middle" fontSize={9 * inv} letterSpacing={3 * inv} fill="var(--muted-foreground)" fillOpacity={l.dim ? 0.35 : 0.6} fontWeight={600}>{l.t}</text>
          ); })}
          {CITIES.map((c) => { const [x, y] = proj(c.lon, c.lat); return (
            <g key={c.t}>
              <rect x={x - 1.6 * inv} y={y - 1.6 * inv} width={3.2 * inv} height={3.2 * inv} fill="var(--muted-foreground)" fillOpacity={0.7} />
              <text x={x + 5 * inv} y={y + 3 * inv} fontSize={8.5 * inv} fill="var(--muted-foreground)" fillOpacity={0.8}>{c.t}</text>
            </g>
          ); })}

          {layers.weather && wind.map((w, i) => (
            <g key={i} transform={`translate(${w.x} ${w.y}) rotate(${w.a}) scale(${inv})`} opacity={0.55}>
              <line x1={0} y1={-9 * w.m} x2={0} y2={9 * w.m} stroke="var(--signal)" strokeWidth={0.9} />
              <path d={`M-3,${-9 * w.m + 4}L0,${-9 * w.m}L3,${-9 * w.m + 4}`} fill="none" stroke="var(--signal)" strokeWidth={0.9} />
            </g>
          ))}

          {layers.risk && alerts.map((a) => { const [x, y] = proj(a.lon, a.lat); return (
            <circle key={a.id} cx={x} cy={y} r={(10 + a.probability * 26) * Math.max(inv, 0.35)} fill="url(#heat)" style={{ color: SEV_VAR[a.severity] }} pointerEvents="none" />
          ); })}

          {layers.detections && detectionDots.map((d, i) => (
            <rect key={i} x={d.x - 0.9 * Math.max(inv, 0.3)} y={d.y - 0.9 * Math.max(inv, 0.3)} width={1.8 * Math.max(inv, 0.3)} height={1.8 * Math.max(inv, 0.3)} fill={SEV_VAR[d.s]} fillOpacity={0.75} pointerEvents="none" />
          ))}

          {groups.map((g) => {
            const top = g.items[0]!;
            const isSel = g.items.some((a) => a.id === selectedId);
            if (g.items.length > 1) return (
              <g key={top.id} transform={`translate(${g.x} ${g.y}) scale(${inv})`} className="cursor-pointer"
                onClick={() => { if (drag.current?.moved) return; zoomAt(g.x, g.y, 2.6 / z > 1 ? 2.6 / z * 1.2 : 1.6); onSelect(top.id); }}>
                <circle r={13} fill="var(--background)" fillOpacity={0.85} stroke={SEV_VAR[top.severity]} strokeWidth={1.4} />
                <circle r={16.5} fill="none" stroke={isSel ? "var(--signal)" : SEV_VAR[top.severity]} strokeOpacity={isSel ? 1 : 0.35} strokeWidth={1} />
                <text y={4} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--foreground)" className="tnum">{g.items.length}</text>
              </g>
            );
            const a = top; const r = 4.5 + a.probability * 4;
            return (
              <g key={a.id} transform={`translate(${g.x} ${g.y}) scale(${inv})`} className="cursor-pointer" onClick={() => { if (!drag.current?.moved) onSelect(a.id); }}>
                <circle r={r + 8} fill="transparent" />
                {a.id === selectedId && <>
                  <circle r={r + 4} fill="none" stroke="var(--signal)" strokeWidth={1.2} className="signal-ring" />
                  <circle r={r + 5} fill="none" stroke="var(--signal)" strokeWidth={1.2} />
                </>}
                <circle r={r} fill={SEV_VAR[a.severity]} stroke="var(--background)" strokeWidth={1.5} />
                {z > 2.6 && <text x={r + 6} y={3.5} fontSize={9.5} fill="var(--foreground)" fontWeight={500}>{a.name}</text>}
              </g>
            );
          })}
          {sel && z <= 2.6 && (() => { const [x, y] = proj(sel.lon, sel.lat); return (
            <g transform={`translate(${x} ${y}) scale(${inv})`} pointerEvents="none">
              <line x1={10} y1={-10} x2={26} y2={-26} stroke="var(--signal)" strokeWidth={0.8} />
              <rect x={26} y={-38} width={sel.name.length * 6 + 70} height={18} rx={2} fill="var(--background)" fillOpacity={0.9} stroke="var(--signal)" strokeOpacity={0.6} strokeWidth={0.8} />
              <text x={32} y={-26} fontSize={9.5} fill="var(--foreground)" fontWeight={600}>{sel.name}<tspan fill="var(--signal)" dx={6} className="tnum">p={sel.probability.toFixed(2)}</tspan></text>
            </g>
          ); })()}
        </g>
      </svg>

      {/* overlays */}
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1">
        <span className="eyebrow">{caption ?? "Thermal anomaly field"}</span>
        <span className="font-mono text-[10px] text-muted-foreground tnum">VIIRS 375 m · {alerts.length} clusters · zoom {z.toFixed(1)}×</span>
      </div>
      <div className="absolute right-3 top-3 flex flex-col gap-1.5">
        {[{ i: Plus, f: () => zoomAt(W / 2, H / 2, 1.4), l: "Zoom in" }, { i: Minus, f: () => zoomAt(W / 2, H / 2, 1 / 1.4), l: "Zoom out" }, { i: RotateCcw, f: () => setView(initial()), l: "Reset view" }].map(({ i: I, f, l }) => (
          <button key={l} aria-label={l} onClick={f} className="grid h-7 w-7 place-items-center rounded-sm border bg-background/85 text-muted-foreground backdrop-blur transition hover:border-signal/60 hover:text-signal"><I className="h-3.5 w-3.5" /></button>
        ))}
        <button aria-label="Layers" onClick={() => setShowLayers((s) => !s)} className={cn("grid h-7 w-7 place-items-center rounded-sm border bg-background/85 backdrop-blur transition hover:text-signal", showLayers ? "border-signal/60 text-signal" : "text-muted-foreground")}><Layers className="h-3.5 w-3.5" /></button>
      </div>
      {showLayers && (
        <div className="absolute right-12 top-3 w-52 rounded-md border bg-popover/95 p-2.5 backdrop-blur">
          <div className="eyebrow mb-2">Layers</div>
          {([["detections", "Satellite detections", "VIIRS pixels"], ["risk", "Risk assessment", "Probability halo"], ["weather", "Weather · wind", "Illustrative field"]] as const).map(([k, l, s]) => (
            <label key={k} className="flex cursor-pointer items-center gap-2 rounded-sm px-1.5 py-1.5 text-xs hover:bg-accent">
              <input type="checkbox" checked={layers[k]} onChange={() => setLayers((v) => ({ ...v, [k]: !v[k] }))} className="accent-signal" />
              <span className="flex-1">{l}</span><span className="text-[10px] text-muted-foreground">{s}</span>
            </label>
          ))}
        </div>
      )}
      <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm border bg-background/85 px-2.5 py-1.5 backdrop-blur">
        {SEV_ORDER.map((s) => (
          <span key={s} className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="h-2 w-2 rounded-full" style={{ background: SEV_VAR[s] }} />{SEV_LABEL[s]}</span>
        ))}
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="grid h-3 w-3 place-items-center rounded-full border text-[7px]">n</span>Cluster</span>
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 text-right font-mono text-[9px] leading-tight text-muted-foreground/70">
        <div>{(LAT1 - (H / 2 - ty) / z / 40).toFixed(2)}°N · simplified outlines</div>
        <div>Demo detections · FireWatch AI cartography</div>
      </div>
    </div>
  );
}
