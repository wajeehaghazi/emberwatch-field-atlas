import { createFileRoute } from "@tanstack/react-router";
import { FireMap } from "@/components/fw/FireMap";
import { AlertQueue } from "@/components/fw/AlertQueue";
import { HotspotDetail } from "@/components/fw/HotspotDetail";
import { ActivityChart, RiskComparison, SeverityDistribution, SummaryMetrics } from "@/components/fw/Charts";
import { ActivityFeed } from "@/components/fw/ActivityFeed";
import { PanelHeader } from "@/components/fw/Shell";
import { filterAlerts, useFW, useRegionAlerts } from "@/lib/firewatch/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview · FireWatch AI" },
      { name: "description", content: "Wildfire intelligence workstation: ranked VIIRS hotspots, risk map and explainable 24 h escalation scores." },
      { property: "og:title", content: "FireWatch AI — Overview" },
      { property: "og:description", content: "See the signal. Understand the risk. Verify the evidence." },
    ],
  }),
  component: Overview,
});

function Overview() {
  const fw = useFW();
  const alerts = useRegionAlerts();
  const visible = filterAlerts(alerts, fw);
  const selected = alerts.find((a) => a.id === fw.selectedId);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2 px-1">
        <p className="text-[13px] text-muted-foreground"><span className="text-foreground">See the signal.</span> Understand the risk. Verify the evidence.</p>
        <span className="font-mono text-[10px] text-muted-foreground">Prototype scoring · weighted logistic · not a trained model</span>
      </div>
      <div className="panel overflow-hidden"><SummaryMetrics alerts={alerts} /></div>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px_360px] lg:grid-cols-[minmax(0,1fr)_340px]">
        <FireMap alerts={visible} selectedId={fw.selectedId} onSelect={fw.setSelectedId} region={fw.region} className="h-[460px] lg:h-[640px]" />
        <AlertQueue alerts={alerts} className="h-[460px] lg:h-[640px]" />
        <HotspotDetail alert={selected} className="h-[640px] lg:col-span-2 xl:col-span-1" />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <section className="panel"><PanelHeader title="Severity distribution" meta={`${alerts.length} clusters in region`} /><div className="p-4"><SeverityDistribution alerts={alerts} /></div></section>
        <section className="panel"><PanelHeader title="Hotspot activity · 8 days" meta={selected ? `All vs ${selected.id}` : "All clusters"} /><div className="p-2 pt-3"><ActivityChart alerts={alerts} selected={selected} /></div></section>
        <section className="panel"><PanelHeader title="Risk probability comparison" meta="Top 12 · click a bar to select" /><div className="p-2 pt-3"><RiskComparison alerts={alerts} selectedId={fw.selectedId} onSelect={fw.setSelectedId} height={150} /></div></section>
        <ActivityFeed className="h-[222px]" />
      </div>
    </div>
  );
}
