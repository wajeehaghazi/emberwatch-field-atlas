import { useEffect, useRef } from "react";
import { filterAlerts, useFW } from "@/lib/firewatch/store";
import { SEV_BG, SEV_LABEL, SEV_ORDER, SEV_TEXT, SEV_VAR, fmtTime, type ScoredAlert } from "@/lib/firewatch/data";
import { cn } from "@/lib/utils";
import { PanelHeader } from "./Shell";

const CONF = { h: "high", n: "nominal", l: "low" } as const;

export function SevFilters() {
  const { sevFilter, toggleSev } = useFW();
  return (
    <div className="flex gap-1">
      {SEV_ORDER.map((s) => (
        <button key={s} onClick={() => toggleSev(s)} aria-pressed={sevFilter.includes(s)} title={SEV_LABEL[s]}
          className={cn("flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] transition", sevFilter.includes(s) ? "border-border text-foreground" : "border-transparent text-muted-foreground/50")}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: sevFilter.includes(s) ? SEV_VAR[s] : "var(--border)" }} />{SEV_LABEL[s].slice(0, 4)}
        </button>
      ))}
    </div>
  );
}

export function AlertQueue({ alerts, className, title = "Priority queue" }: { alerts: ScoredAlert[]; className?: string; title?: string }) {
  const fw = useFW();
  const list = filterAlerts(alerts, fw);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  useEffect(() => { if (fw.selectedId) refs.current[fw.selectedId]?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [fw.selectedId]);
  return (
    <section className={cn("panel flex min-h-0 flex-col", className)}>
      <PanelHeader title={title} meta={`${list.length} of ${alerts.length} clusters · ranked by ${fw.sort === "risk" ? "probability" : "detection time"}`}>
        <div className="flex rounded-sm border p-0.5 text-[10px]">
          {(["risk", "time"] as const).map((k) => (
            <button key={k} onClick={() => fw.setSort(k)} className={cn("rounded-[2px] px-1.5 py-0.5", fw.sort === k ? "bg-accent text-foreground" : "text-muted-foreground")}>{k === "risk" ? "Risk" : "Time"}</button>
          ))}
        </div>
      </PanelHeader>
      <div className="border-b px-3.5 py-2"><SevFilters /></div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        {list.length === 0 && <div className="p-6 text-center text-xs text-muted-foreground">No clusters match the current filters.<br />Adjust severity, region or search.</div>}
        {list.map((a, i) => {
          const sel = a.id === fw.selectedId;
          return (
            <button key={a.id} ref={(el) => { refs.current[a.id] = el; }} onClick={() => fw.setSelectedId(a.id)}
              className={cn("relative grid w-full grid-cols-[20px_1fr_auto] items-center gap-x-3 border-b border-border/60 px-3.5 py-2.5 text-left transition-colors", sel ? "bg-signal/[0.07]" : "hover:bg-accent/40")}>
              {sel && <span className="absolute inset-y-0 left-0 w-[2px] bg-signal" />}
              <span className="font-mono text-[10px] text-muted-foreground tnum">{String(i + 1).padStart(2, "0")}</span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", SEV_BG[a.severity])} />
                  <span className="truncate text-[13px] font-medium">{a.name}</span>
                </span>
                <span className="mt-0.5 block truncate font-mono text-[10px] text-muted-foreground tnum">{a.id} · {a.county}, {a.state} · {fmtTime(a.acqTime)} · {a.satellite} · conf {CONF[a.confidence]}</span>
              </span>
              <span className="text-right">
                <span className={cn("block font-mono text-sm font-semibold tnum", SEV_TEXT[a.severity])}>{a.probability.toFixed(2)}</span>
                <span className="block text-[9px] uppercase tracking-wider text-muted-foreground">{SEV_LABEL[a.severity]}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
