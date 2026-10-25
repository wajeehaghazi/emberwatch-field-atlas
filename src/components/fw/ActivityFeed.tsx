import { ALERTS, SEV_LABEL, SEV_VAR } from "@/lib/firewatch/data";
import { useFW } from "@/lib/firewatch/store";
import { PanelHeader } from "./Shell";
import { cn } from "@/lib/utils";

const PASS = ["0912", "0954", "1036", "1118"];
export const EVENTS = ALERTS.flatMap((a, i) => {
  const t = a.acqTime;
  const m = (off: number) => { const tot = parseInt(t.slice(0, 2)) * 60 + parseInt(t.slice(2)) + off; return `${String(Math.floor(tot / 60)).padStart(2, "0")}:${String(tot % 60).padStart(2, "0")}`; };
  const ev = [
    { id: a.id, at: m(3 + (i % 3)), kind: "Detection received", text: `${a.detections} VIIRS px · ${a.satellite} pass ${PASS.indexOf(t) + 1}`, color: "var(--muted-foreground)" },
    { id: a.id, at: m(6 + (i % 4)), kind: "Assessment updated", text: `p=${a.probability.toFixed(2)} → ${SEV_LABEL[a.severity]}`, color: SEV_VAR[a.severity] },
  ];
  if (a.severity === "critical") ev.push({ id: a.id, at: m(9), kind: "Evidence hashed", text: "SHA-256 payload recorded locally", color: "var(--signal)" });
  return ev;
}).sort((x, y) => y.at.localeCompare(x.at));

export function ActivityFeed({ className, limit = 14 }: { className?: string; limit?: number }) {
  const { setSelectedId, selectedId } = useFW();
  return (
    <section className={cn("panel flex min-h-0 flex-col", className)}>
      <PanelHeader title="Recent activity" meta="Simulated pipeline events"><span className="rounded-sm border border-sev-medium/40 px-1.5 py-0.5 font-mono text-[9px] text-sev-medium">SIMULATED</span></PanelHeader>
      <ol className="scroll-thin min-h-0 flex-1 overflow-y-auto px-3.5 py-2">
        {EVENTS.slice(0, limit).map((e, i) => (
          <li key={i}>
            <button onClick={() => setSelectedId(e.id)} className={cn("grid w-full grid-cols-[44px_10px_1fr] gap-2 rounded-sm py-1.5 text-left", selectedId === e.id && "bg-accent/40")}>
              <span className="font-mono text-[10px] text-muted-foreground tnum">{e.at}</span>
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full" style={{ background: e.color }} />
              <span className="min-w-0"><span className="block text-[11.5px]">{e.kind} <span className="font-mono text-[10px] text-muted-foreground">{e.id}</span></span><span className="block truncate text-[10.5px] text-muted-foreground">{e.text}</span></span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
