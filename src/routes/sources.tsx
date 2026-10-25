import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, KeyRound, Loader2, Plug, XCircle } from "lucide-react";
import { PanelHeader } from "@/components/fw/Shell";
import { MODEL_VERSION } from "@/lib/firewatch/scoring";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sources")({
  head: () => ({
    meta: [
      { title: "Data Sources · FireWatch AI" },
      { name: "description", content: "NASA FIRMS, Open-Meteo and NASA POWER: what each source provides and which connections are live versus demo." },
      { property: "og:title", content: "Data Sources · FireWatch AI" },
      { property: "og:description", content: "Honest connection status for every FireWatch data source." },
    ],
  }),
  component: Sources,
});

type Status = { state: "idle" | "loading" | "ok" | "error"; msg?: string };

const SOURCES = [
  {
    key: "firms", name: "NASA FIRMS", role: "Satellite fire detections", product: "VIIRS NOAA-20 / NOAA-21 NRT · 375 m",
    fields: ["latitude", "longitude", "acq_date", "acq_time", "satellite", "instrument", "frp", "bright_ti4", "confidence (l/n/h)"],
    note: "Requires a free MAP_KEY. No key is configured, so all detections shown are clearly labelled demonstration records.",
    test: null,
  },
  {
    key: "meteo", name: "Open-Meteo", role: "Current weather at each hotspot", product: "forecast API · current conditions",
    fields: ["temperature_2m", "relative_humidity_2m", "wind_speed_10m", "wind_gusts_10m", "wind_direction_10m"],
    note: "Keyless public API. Live Monitoring fetches real current conditions for the selected hotspot.",
    test: "https://api.open-meteo.com/v1/forecast?latitude=40.05&longitude=-121.05&current=temperature_2m",
  },
  {
    key: "power", name: "NASA POWER", role: "Historical climate baselines", product: "climatology · point · AG community",
    fields: ["T2M", "PRECTOTCORR", "RH2M"],
    note: "Keyless public API. Baselines feed temperature and precipitation anomaly features; demo values are used in scoring.",
    test: "https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=T2M&community=AG&longitude=-121.05&latitude=40.05&format=JSON",
  },
] as const;

function Sources() {
  const [st, setSt] = useState<Record<string, Status>>({});
  const run = async (key: string, url: string) => {
    setSt((s) => ({ ...s, [key]: { state: "loading" } }));
    const t0 = performance.now();
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await r.json();
      setSt((s) => ({ ...s, [key]: { state: "ok", msg: `Responded in ${Math.round(performance.now() - t0)} ms` } }));
    } catch (e) {
      setSt((s) => ({ ...s, [key]: { state: "error", msg: e instanceof Error ? e.message : "Request failed" } }));
    }
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 lg:grid-cols-3">
        {SOURCES.map((s, i) => {
          const status = st[s.key];
          return (
            <section key={s.key} className="panel flex flex-col">
              <div className="border-b p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground">0{i + 1} · {s.role}</span>
                  {s.test === null
                    ? <span className="flex items-center gap-1 rounded-sm border border-sev-medium/50 px-1.5 py-0.5 font-mono text-[9px] text-sev-medium"><KeyRound className="h-2.5 w-2.5" />KEY REQUIRED</span>
                    : status?.state === "ok" ? <span className="rounded-sm border border-sev-low/50 px-1.5 py-0.5 font-mono text-[9px] text-sev-low">REACHABLE</span>
                    : status?.state === "error" ? <span className="rounded-sm border border-sev-critical/50 px-1.5 py-0.5 font-mono text-[9px] text-sev-critical">UNREACHABLE</span>
                    : <span className="rounded-sm border px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">NOT TESTED</span>}
                </div>
                <h2 className="mt-2 text-lg font-semibold">{s.name}</h2>
                <div className="text-[11px] text-muted-foreground">{s.product}</div>
              </div>
              <div className="flex-1 p-4">
                <div className="eyebrow mb-2">Fields used</div>
                <div className="flex flex-wrap gap-1">{s.fields.map((f) => <span key={f} className="rounded-sm border bg-background px-1.5 py-0.5 font-mono text-[10px]">{f}</span>)}</div>
                <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">{s.note}</p>
              </div>
              <div className="border-t p-4">
                {s.test ? (
                  <>
                    <button onClick={() => run(s.key, s.test!)} disabled={status?.state === "loading"} className="flex w-full items-center justify-center gap-2 rounded-sm border px-3 py-2 text-xs hover:border-signal/60 hover:text-signal disabled:opacity-60">
                      {status?.state === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plug className="h-3.5 w-3.5" />}Test connection
                    </button>
                    {status?.msg && <div className={cn("mt-2 flex items-center gap-1.5 text-[11px]", status.state === "ok" ? "text-sev-low" : "text-sev-critical")}>{status.state === "ok" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}{status.msg}</div>}
                  </>
                ) : <div className="text-[11px] text-muted-foreground">Status: not connected — using demo detections.</div>}
              </div>
            </section>
          );
        })}
      </div>
      <section className="panel">
        <PanelHeader title="Pipeline" meta="From satellite pixel to verified alert" />
        <div className="grid gap-px bg-border sm:grid-cols-3 lg:grid-cols-6">
          {[["Ingest", "FIRMS VIIRS NRT detections"], ["Enrich", "Open-Meteo weather + POWER baselines"], ["Features", "FRP, cluster size, persistence, anomalies"], ["Score", MODEL_VERSION], ["Rank", "Thresholds 0.35 · 0.55 · 0.75"], ["Verify", "SHA-256 evidence · anchoring not connected"]].map(([t, d], i) => (
            <div key={t} className="bg-surface p-4"><div className="font-mono text-[10px] text-signal">0{i + 1}</div><div className="mt-1 text-[13px] font-medium">{t}</div><div className="mt-1 text-[11px] text-muted-foreground">{d}</div></div>
          ))}
        </div>
        <p className="border-t px-4 py-3 text-[11px] text-muted-foreground">Task: estimate whether a hotspot cluster may persist or show stronger satellite activity over the next 24 h. This is not a fire-spread prediction, and priority levels are prototype values pending validation.</p>
      </section>
    </div>
  );
}
