import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownUp } from "lucide-react";
import { HotspotDetail } from "@/components/fw/HotspotDetail";
import { PanelHeader } from "@/components/fw/Shell";
import { SevFilters } from "@/components/fw/AlertQueue";
import { RiskComparison } from "@/components/fw/Charts";
import { filterAlerts, useFW, useRegionAlerts } from "@/lib/firewatch/store";
import { SEV_BG, SEV_LABEL, SEV_TEXT, fmtTime } from "@/lib/firewatch/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/explorer")({
  head: () => ({
    meta: [
      { title: "Hotspot Explorer · FireWatch AI" },
      { name: "description", content: "Inspect every hotspot cluster with FIRMS fields, weather, climate anomalies and factor-level score breakdowns." },
      { property: "og:title", content: "Hotspot Explorer · FireWatch AI" },
      { property: "og:description", content: "Every FIRMS field, every scoring factor, in one table." },
    ],
  }),
  component: Explorer,
});

function Explorer() {
  const fw = useFW();
  const alerts = useRegionAlerts();
  const list = filterAlerts(alerts, fw);
  const sel = alerts.find((a) => a.id === fw.selectedId);
  const cols = ["#", "Cluster", "Sev.", "p", "FRP MW", "TI4 K", "Conf", "Det.", "Sat", "Acq.", "Wind", "RH"];
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex min-w-0 flex-col gap-3">
        <section className="panel min-w-0">
          <PanelHeader title="Hotspot clusters" meta={`${list.length} records · demo FIRMS VIIRS NRT fields`}>
            <SevFilters />
            <button onClick={() => fw.setSort(fw.sort === "risk" ? "time" : "risk")} className="flex items-center gap-1 rounded-sm border px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"><ArrowDownUp className="h-3 w-3" />{fw.sort === "risk" ? "Risk" : "Time"}</button>
          </PanelHeader>
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-[12px]">
              <thead><tr className="border-b">{cols.map((c) => <th key={c} className="eyebrow px-3 py-2 font-semibold">{c}</th>)}</tr></thead>
              <tbody>
                {list.map((a, i) => (
                  <tr key={a.id} onClick={() => fw.setSelectedId(a.id)} className={cn("cursor-pointer border-b border-border/50 transition-colors", a.id === fw.selectedId ? "bg-signal/[0.07]" : "hover:bg-accent/40")}>
                    <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2"><div className="font-medium">{a.name}</div><div className="font-mono text-[10px] text-muted-foreground">{a.id} · {a.county}, {a.state}</div></td>
                    <td className="px-3 py-2"><span className="flex items-center gap-1.5"><span className={cn("h-1.5 w-1.5 rounded-full", SEV_BG[a.severity])} />{SEV_LABEL[a.severity]}</span></td>
                    <td className={cn("px-3 py-2 font-mono font-semibold tnum", SEV_TEXT[a.severity])}>{a.probability.toFixed(3)}</td>
                    <td className="px-3 py-2 font-mono tnum">{a.frp.toFixed(1)}</td>
                    <td className="px-3 py-2 font-mono tnum">{a.brightTi4.toFixed(1)}</td>
                    <td className="px-3 py-2 font-mono">{a.confidence}</td>
                    <td className="px-3 py-2 font-mono tnum">{a.detections}</td>
                    <td className="px-3 py-2 font-mono">{a.satellite}</td>
                    <td className="px-3 py-2 font-mono tnum">{fmtTime(a.acqTime)}</td>
                    <td className="px-3 py-2 font-mono tnum">{a.weather.windKmh}</td>
                    <td className="px-3 py-2 font-mono tnum">{a.weather.rh}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.length === 0 && <div className="p-8 text-center text-xs text-muted-foreground">No records match the filters.</div>}
          </div>
        </section>
        {sel && (
          <section className="panel">
            <PanelHeader title="Full factor breakdown" meta={`${sel.id} · logit ${sel.logit.toFixed(2)} = −3.75 intercept + Σ contributions`} />
            <div className="grid gap-x-8 gap-y-1 p-4 md:grid-cols-2">
              {[...sel.contributions].sort((a, b) => b.contribution - a.contribution).map((c) => (
                <div key={c.key} className="grid grid-cols-[150px_1fr_52px] items-center gap-3 py-1">
                  <span className="text-[11.5px]">{c.label}<span className="block font-mono text-[10px] text-muted-foreground">{c.value} · w {c.weight}</span></span>
                  <div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-signal" style={{ width: `${Math.max(0, c.contribution / 1.6) * 100}%` }} /></div>
                  <span className="text-right font-mono text-[11px] tnum">{c.contribution >= 0 ? "+" : ""}{c.contribution.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </section>
        )}
        <section className="panel"><PanelHeader title="Risk probability comparison" meta="Dashed line marks the critical threshold (0.75)" /><div className="p-2 pt-3"><RiskComparison alerts={alerts} selectedId={fw.selectedId} onSelect={fw.setSelectedId} height={200} /></div></section>
      </div>
      <HotspotDetail alert={sel} className="xl:sticky xl:top-20 xl:h-[calc(100vh-6rem)]" />
    </div>
  );
}
