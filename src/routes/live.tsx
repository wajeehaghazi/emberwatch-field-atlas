import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CloudSun, Loader2, TriangleAlert } from "lucide-react";
import { FireMap } from "@/components/fw/FireMap";
import { AlertQueue } from "@/components/fw/AlertQueue";
import { ActivityFeed } from "@/components/fw/ActivityFeed";
import { PanelHeader } from "@/components/fw/Shell";
import { filterAlerts, useFW, useRegionAlerts } from "@/lib/firewatch/store";
import { SEV_TEXT, fmtTime, type ScoredAlert } from "@/lib/firewatch/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live Monitoring · FireWatch AI" },
      { name: "description", content: "Monitor VIIRS satellite passes, hotspot clusters and real Open-Meteo weather at each detection." },
      { property: "og:title", content: "Live Monitoring · FireWatch AI" },
      { property: "og:description", content: "Satellite pass monitoring with live Open-Meteo conditions." },
    ],
  }),
  component: Live,
});

function LiveWeather({ a }: { a: ScoredAlert }) {
  const q = useQuery({
    queryKey: ["openmeteo", a.lat, a.lon],
    queryFn: async () => {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${a.lat}&longitude=${a.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,wind_direction_10m`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()) as { current: { time: string; temperature_2m: number; relative_humidity_2m: number; wind_speed_10m: number; wind_gusts_10m: number; wind_direction_10m: number } };
    },
    staleTime: 10 * 60_000,
    retry: 1,
  });
  return (
    <section className="panel">
      <PanelHeader title="Current weather at hotspot" meta={`${a.name} · ${a.lat.toFixed(2)}°, ${a.lon.toFixed(2)}°`}>
        {q.isSuccess && <span className="flex items-center gap-1.5 rounded-sm border border-sev-low/40 px-1.5 py-0.5 font-mono text-[9px] text-sev-low"><span className="h-1.5 w-1.5 rounded-full bg-sev-low pulse-dot" />OPEN-METEO LIVE</span>}
      </PanelHeader>
      <div className="p-4">
        {q.isPending && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Requesting Open-Meteo…</div>}
        {q.isError && <div className="flex items-start gap-2 text-xs text-sev-high"><TriangleAlert className="h-3.5 w-3.5" />Open-Meteo unreachable ({String(q.error.message)}). Showing demo weather in the assessment.</div>}
        {q.isSuccess && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[["Temp", `${q.data.current.temperature_2m} °C`, `${a.weather.tempC} demo`], ["RH", `${q.data.current.relative_humidity_2m}%`, `${a.weather.rh}% demo`], ["Wind", `${q.data.current.wind_speed_10m} km/h`, `${a.weather.windKmh} demo`], ["Gust", `${q.data.current.wind_gusts_10m} km/h`, `${a.weather.gustKmh} demo`]].map(([k, v, d]) => (
                <div key={k}><div className="eyebrow">{k}</div><div className="font-mono text-lg tnum">{v}</div><div className="font-mono text-[10px] text-muted-foreground">{d}</div></div>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[10.5px] text-muted-foreground"><CloudSun className="h-3 w-3" />Observed {q.data.current.time} UTC. Real conditions — the scored assessment still uses the demo snapshot so the demo stays reproducible.</p>
          </>
        )}
      </div>
    </section>
  );
}

function Live() {
  const fw = useFW();
  const alerts = useRegionAlerts();
  const visible = filterAlerts(alerts, fw);
  const sel = alerts.find((a) => a.id === fw.selectedId) ?? alerts[0];
  const passes = ["0912", "0954", "1036", "1118"].map((t) => ({ t, list: alerts.filter((a) => a.acqTime === t) }));
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-3">
        <FireMap alerts={visible} selectedId={fw.selectedId} onSelect={fw.setSelectedId} region={fw.region} caption="Live monitoring · latest passes" className="h-[480px] lg:h-[560px]" />
        <section className="panel">
          <PanelHeader title="Satellite pass log" meta="VIIRS NRT overpasses · 2026-10-25 · demo" />
          <div className="grid divide-y sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {passes.map((p, i) => (
              <div key={p.t} className="p-3.5">
                <div className="flex items-baseline justify-between"><span className="font-mono text-sm tnum">{fmtTime(p.t)}</span><span className="text-[10px] text-muted-foreground">Pass {i + 1} · {i % 2 ? "NOAA-20" : "NOAA-21"}</span></div>
                <div className="mt-2 flex flex-col gap-1">
                  {p.list.map((a) => (
                    <button key={a.id} onClick={() => fw.setSelectedId(a.id)} className={cn("flex justify-between rounded-sm px-1.5 py-1 text-left text-[11px] hover:bg-accent/50", a.id === fw.selectedId && "bg-accent")}>
                      <span className="truncate">{a.name}</span><span className={cn("font-mono tnum", SEV_TEXT[a.severity])}>{a.probability.toFixed(2)}</span>
                    </button>
                  ))}
                  {p.list.length === 0 && <span className="text-[11px] text-muted-foreground">No clusters in region</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
        {sel && <LiveWeather a={sel} />}
      </div>
      <div className="flex flex-col gap-3">
        <AlertQueue alerts={alerts} className="h-[480px]" title="Incoming alerts" />
        <ActivityFeed className="h-[420px]" limit={30} />
      </div>
    </div>
  );
}
