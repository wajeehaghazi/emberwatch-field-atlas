import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { FireMap } from "@/components/fw/FireMap";
import { PanelHeader } from "@/components/fw/Shell";
import { useFW } from "@/lib/firewatch/store";
import { REPLAY_DAYS, SEV_BG, SEV_LABEL, SEV_TEXT, replayFrame } from "@/lib/firewatch/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/replay")({
  head: () => ({
    meta: [
      { title: "Historical Replay · FireWatch AI" },
      { name: "description", content: "Step through eight days of simulated VIIRS hotspot history and watch risk rankings change." },
      { property: "og:title", content: "Historical Replay · FireWatch AI" },
      { property: "og:description", content: "Replay hotspot activity and changing risk rankings day by day." },
    ],
  }),
  component: Replay,
});

function Replay() {
  const fw = useFW();
  const [day, setDay] = useState(REPLAY_DAYS.length - 1);
  const [playing, setPlaying] = useState(false);
  const frames = useMemo(() => REPLAY_DAYS.map((_, i) => replayFrame(i).filter((a) => fw.region === "all" || a.state === fw.region)), [fw.region]);
  const frame = frames[day] ?? [];
  const ranked = [...frame].sort((a, b) => b.probability - a.probability);
  const prevRank = new Map([...(frames[day - 1] ?? [])].sort((a, b) => b.probability - a.probability).map((a, i) => [a.id, i]));

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setDay((d) => { if (d >= REPLAY_DAYS.length - 1) { setPlaying(false); return d; } return d + 1; }), 1100);
    return () => clearInterval(t);
  }, [playing]);

  const counts = frames.map((f, i) => ({ d: REPLAY_DAYS[i], i, n: f.reduce((s, a) => s + a.detections, 0), c: f.filter((a) => a.severity === "critical").length }));

  return (
    <div className="flex flex-col gap-3">
      <section className="panel">
        <div className="flex flex-wrap items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-1">
            <button aria-label="Previous day" onClick={() => setDay((d) => Math.max(0, d - 1))} className="grid h-8 w-8 place-items-center rounded-sm border hover:text-signal"><SkipBack className="h-3.5 w-3.5" /></button>
            <button aria-label={playing ? "Pause" : "Play"} onClick={() => { if (!playing && day === REPLAY_DAYS.length - 1) setDay(0); setPlaying((p) => !p); }} className="grid h-8 w-10 place-items-center rounded-sm bg-signal text-primary-foreground">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
            <button aria-label="Next day" onClick={() => setDay((d) => Math.min(REPLAY_DAYS.length - 1, d + 1))} className="grid h-8 w-8 place-items-center rounded-sm border hover:text-signal"><SkipForward className="h-3.5 w-3.5" /></button>
          </div>
          <div>
            <div className="eyebrow">Replay frame</div>
            <div className="font-mono text-sm tnum">2026 · {REPLAY_DAYS[day]} · {frame.length} clusters</div>
          </div>
          <div className="min-w-[240px] flex-1">
            <input type="range" min={0} max={REPLAY_DAYS.length - 1} value={day} onChange={(e) => { setPlaying(false); setDay(+e.target.value); }} className="w-full accent-signal" aria-label="Replay date" />
            <div className="flex justify-between font-mono text-[9px] text-muted-foreground">{REPLAY_DAYS.map((d, i) => <button key={d} onClick={() => setDay(i)} className={cn(i === day && "text-signal")}>{d}</button>)}</div>
          </div>
          <span className="rounded-sm border border-sev-medium/50 px-2 py-1 font-mono text-[10px] text-sev-medium">SIMULATED HISTORY</span>
        </div>
      </section>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
        <FireMap alerts={frame} selectedId={fw.selectedId} onSelect={fw.setSelectedId} region={fw.region} caption={`Replay · ${REPLAY_DAYS[day]}`} className="h-[480px] lg:h-[600px]" />
        <section className="panel flex h-[600px] flex-col">
          <PanelHeader title="Risk ranking on this day" meta="Arrows show rank change vs previous day" />
          <div className="scroll-thin flex-1 overflow-y-auto">
            {ranked.length === 0 && <div className="p-6 text-center text-xs text-muted-foreground">No detections on this day.</div>}
            {ranked.map((a, i) => {
              const prev = prevRank.get(a.id);
              const delta = prev === undefined ? null : prev - i;
              return (
                <button key={a.id} onClick={() => fw.setSelectedId(a.id)} className={cn("grid w-full grid-cols-[22px_1fr_auto_36px] items-center gap-2 border-b border-border/60 px-3.5 py-2 text-left", a.id === fw.selectedId ? "bg-signal/[0.07]" : "hover:bg-accent/40")}>
                  <span className="font-mono text-[10px] text-muted-foreground">{i + 1}</span>
                  <span className="min-w-0"><span className="flex items-center gap-2 text-[12.5px]"><span className={cn("h-1.5 w-1.5 rounded-full", SEV_BG[a.severity])} />{a.name}</span><span className="font-mono text-[10px] text-muted-foreground">{a.detections} det · {a.frp.toFixed(1)} MW · {SEV_LABEL[a.severity]}</span></span>
                  <span className={cn("font-mono text-sm tnum", SEV_TEXT[a.severity])}>{a.probability.toFixed(2)}</span>
                  <span className={cn("text-right font-mono text-[10px]", delta === null ? "text-signal" : delta > 0 ? "text-sev-low" : delta < 0 ? "text-sev-critical" : "text-muted-foreground")}>{delta === null ? "NEW" : delta > 0 ? `▲${delta}` : delta < 0 ? `▼${-delta}` : "—"}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
      <section className="panel">
        <PanelHeader title="Hotspot detections over time" meta="VIIRS pixels per day · click a bar to jump" />
        <div className="p-2 pt-3">
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={counts} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontSize: 11 }} cursor={{ fill: "var(--accent)", fillOpacity: 0.4 }} formatter={(v, n) => [v, n === "n" ? "detections" : "critical"]} />
              <Bar dataKey="n" radius={[2, 2, 0, 0]} onClick={(d: { i?: number }) => d.i !== undefined && setDay(d.i)} className="cursor-pointer">
                {counts.map((c) => <Cell key={c.d} fill={c.i === day ? "var(--signal)" : "var(--border)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
