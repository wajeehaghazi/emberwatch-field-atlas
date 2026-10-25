import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, Satellite, ShieldCheck, Wind } from "lucide-react";
import { MODEL_VERSION } from "@/lib/firewatch/scoring";
import { SEV_LABEL, SEV_RANGE, SEV_TEXT, SEV_VAR, evidencePayload, explain, fmtTime, type ScoredAlert } from "@/lib/firewatch/data";
import { canonicalize, sha256Hex } from "@/lib/firewatch/hash";
import { cn } from "@/lib/utils";
import { EnvironmentContext } from "./Charts";

const CONF = { h: "high", n: "nominal", l: "low" } as const;

export function useEvidenceHash(a: ScoredAlert | undefined) {
  const [hash, setHash] = useState<string>("");
  useEffect(() => { if (a) sha256Hex(canonicalize(evidencePayload(a))).then(setHash); }, [a]);
  return hash;
}

function KV({ k, v, mono = true }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-[11px] text-muted-foreground">{k}</span>
      <span className={cn("text-right text-[11.5px]", mono && "font-mono tnum")}>{v}</span>
    </div>
  );
}

export function HotspotDetail({ alert: a, className }: { alert?: ScoredAlert; className?: string }) {
  const hash = useEvidenceHash(a);
  if (!a) return <section className={cn("panel grid place-items-center p-8 text-center text-xs text-muted-foreground", className)}>Select a hotspot on the map or in the queue to inspect its assessment.</section>;
  const maxC = Math.max(...a.topFactors.map((f) => f.contribution));
  return (
    <section className={cn("panel scroll-thin flex min-h-0 flex-col overflow-y-auto", className)}>
      <div className="border-b p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[10px] text-muted-foreground">{a.id}</div>
            <h2 className="mt-0.5 truncate text-base font-semibold">{a.name}</h2>
            <div className="text-[11px] text-muted-foreground">{a.county}, {a.state} · {a.lat.toFixed(3)}°, {a.lon.toFixed(3)}°</div>
          </div>
          <span className="shrink-0 rounded-sm border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: SEV_VAR[a.severity], borderColor: `color-mix(in oklab, ${SEV_VAR[a.severity]} 45%, transparent)` }}>{SEV_LABEL[a.severity]}</span>
        </div>
        <div className="mt-4 flex items-end gap-4">
          <div>
            <div className="eyebrow">24 h escalation probability</div>
            <div className={cn("font-mono text-4xl font-semibold leading-none tnum", SEV_TEXT[a.severity])}>{a.probability.toFixed(2)}</div>
          </div>
          <div className="flex-1 pb-1">
            <div className="relative h-1.5 rounded-full" style={{ background: "linear-gradient(90deg, var(--sev-low) 0 35%, var(--sev-medium) 35% 55%, var(--sev-high) 55% 75%, var(--sev-critical) 75%)", opacity: 0.85 }}>
              <span className="absolute -top-1 h-3.5 w-[2px] bg-foreground" style={{ left: `${a.probability * 100}%` }} />
            </div>
            <div className="mt-1 flex justify-between font-mono text-[9px] text-muted-foreground"><span>0</span><span>.35</span><span>.55</span><span>.75</span><span>1</span></div>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">Band {SEV_RANGE[a.severity]} · prototype priority level, not an official emergency classification.</p>
      </div>

      <div className="border-b p-4">
        <div className="eyebrow mb-2.5">Top drivers</div>
        {a.topFactors.map((f) => (
          <div key={f.key} className="mb-2">
            <div className="flex justify-between text-[11.5px]"><span>{f.label}</span><span className="font-mono text-muted-foreground tnum">{f.value} · +{f.contribution.toFixed(2)}</span></div>
            <div className="mt-1 h-1 rounded-full bg-muted"><div className="h-full rounded-full bg-signal" style={{ width: `${(f.contribution / maxC) * 100}%` }} /></div>
          </div>
        ))}
        <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">{explain(a)}</p>
      </div>

      <div className="grid grid-cols-1 gap-x-6 border-b p-4 sm:grid-cols-2">
        <div>
          <div className="eyebrow mb-1.5 flex items-center gap-1.5"><Satellite className="h-3 w-3" />Acquisition · FIRMS</div>
          <KV k="Satellite" v={`${a.instrument} ${a.satellite === "N21" ? "NOAA-21" : "NOAA-20"}`} />
          <KV k="Acquired" v={`${a.acqDate} ${fmtTime(a.acqTime)}`} />
          <KV k="FRP" v={`${a.frp.toFixed(1)} MW`} />
          <KV k="Bright. TI4" v={`${a.brightTi4.toFixed(1)} K`} />
          <KV k="Confidence" v={`${CONF[a.confidence]} (${a.confidence})`} />
          <KV k="Detections" v={a.detections} />
        </div>
        <div>
          <div className="eyebrow mb-1.5 flex items-center gap-1.5"><Wind className="h-3 w-3" />Weather · Open-Meteo</div>
          <KV k="Temperature" v={`${a.weather.tempC} °C`} />
          <KV k="Rel. humidity" v={`${a.weather.rh}%`} />
          <KV k="Wind / gust" v={`${a.weather.windKmh} / ${a.weather.gustKmh} km/h`} />
          <KV k="Direction" v={`${a.weather.windDir}°`} />
          <div className="eyebrow mb-1.5 mt-2">Climate · NASA POWER</div>
          <KV k="Temp anomaly" v={`+${a.climate.tempAnomC} °C`} />
          <KV k="Precip vs normal" v={`${a.climate.precipAnomPct}%`} />
        </div>
      </div>

      <div className="border-b p-4"><EnvironmentContext alert={a} /></div>

      <div className="p-4">
        <div className="eyebrow mb-1.5 flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" />Provenance</div>
        <KV k="Model" v={<span className="text-[10.5px]">{MODEL_VERSION}</span>} />
        <KV k="SHA-256" v={<span className="break-all text-[10px] text-signal">{hash ? `${hash.slice(0, 16)}…${hash.slice(-8)}` : "computing…"}</span>} />
        <KV k="Status" v={<span className="text-sev-low">locally hashed · not anchored</span>} />
        <div className="mt-3 flex gap-2">
          <Link to="/replay" className="flex flex-1 items-center justify-center gap-1.5 rounded-sm border px-3 py-2 text-xs hover:border-signal/60 hover:text-signal">Inspect history <ArrowUpRight className="h-3 w-3" /></Link>
          <Link to="/evidence" className="flex flex-1 items-center justify-center gap-1.5 rounded-sm bg-signal px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90">Verify evidence</Link>
        </div>
      </div>
    </section>
  );
}
