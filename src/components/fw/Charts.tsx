import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { REPLAY_DAYS, SEV_LABEL, SEV_ORDER, SEV_VAR, type ScoredAlert } from "@/lib/firewatch/data";
import { cn } from "@/lib/utils";

const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 11, color: "var(--foreground)" }, labelStyle: { color: "var(--muted-foreground)" }, cursor: { fill: "var(--accent)", fillOpacity: 0.4 } };
const axis = { stroke: "var(--muted-foreground)", fontSize: 10, tickLine: false, axisLine: false } as const;

export function SummaryMetrics({ alerts }: { alerts: ScoredAlert[] }) {
  return (
    <div className="grid grid-cols-2 border-y sm:grid-cols-5 sm:divide-x">
      {SEV_ORDER.map((s) => {
        const n = alerts.filter((a) => a.severity === s).length;
        return (
          <div key={s} className="relative px-4 py-3">
            <span className="absolute left-0 top-3 bottom-3 w-[2px]" style={{ background: SEV_VAR[s] }} />
            <div className="eyebrow">{SEV_LABEL[s]}</div>
            <div className="flex items-baseline gap-2"><span className="font-mono text-2xl font-semibold tnum">{n}</span><span className="text-[10px] text-muted-foreground">clusters</span></div>
          </div>
        );
      })}
      <div className="col-span-2 px-4 py-3 sm:col-span-1">
        <div className="eyebrow">Detections today</div>
        <div className="flex items-baseline gap-2"><span className="font-mono text-2xl font-semibold tnum">{alerts.reduce((s, a) => s + a.detections, 0)}</span><span className="text-[10px] text-muted-foreground">VIIRS px · 4 passes</span></div>
      </div>
    </div>
  );
}

export function SeverityDistribution({ alerts }: { alerts: ScoredAlert[] }) {
  const total = alerts.length || 1;
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-sm">
        {SEV_ORDER.map((s) => { const n = alerts.filter((a) => a.severity === s).length; return n ? <div key={s} style={{ width: `${(n / total) * 100}%`, background: SEV_VAR[s] }} className="border-r-2 border-surface last:border-0" title={`${SEV_LABEL[s]}: ${n}`} /> : null; })}
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {SEV_ORDER.map((s) => { const n = alerts.filter((a) => a.severity === s).length; return (
          <div key={s}><div className="text-[10px] text-muted-foreground">{SEV_LABEL[s]}</div><div className="font-mono text-sm tnum">{Math.round((n / total) * 100)}%</div></div>
        ); })}
      </div>
    </div>
  );
}

export function ActivityChart({ alerts, selected, height = 150 }: { alerts: ScoredAlert[]; selected?: ScoredAlert; height?: number }) {
  const data = REPLAY_DAYS.map((d, i) => ({ d, total: alerts.reduce((s, a) => s + (a.history[i] ?? 0), 0), sel: selected ? selected.history[i] ?? 0 : 0 }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 4, left: -24, bottom: 0 }}>
        <defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--signal)" stopOpacity={0.3} /><stop offset="100%" stopColor="var(--signal)" stopOpacity={0} /></linearGradient></defs>
        <CartesianGrid stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
        <XAxis dataKey="d" {...axis} />
        <YAxis {...axis} />
        <Tooltip {...tip} />
        <Area type="monotone" dataKey="total" name="All clusters" stroke="var(--signal)" strokeWidth={1.5} fill="url(#ga)" />
        {selected && <Area type="monotone" dataKey="sel" name={selected.id} stroke={SEV_VAR[selected.severity]} strokeWidth={1.5} fill="none" strokeDasharray="3 2" />}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RiskComparison({ alerts, selectedId, onSelect, height = 170 }: { alerts: ScoredAlert[]; selectedId: string | null; onSelect: (id: string) => void; height?: number }) {
  const data = [...alerts].sort((a, b) => b.probability - a.probability).slice(0, 12).map((a) => ({ id: a.id.slice(-3), full: a.id, name: a.name, p: +a.probability.toFixed(3), s: a.severity }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 6, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
        <XAxis dataKey="id" {...axis} />
        <YAxis domain={[0, 1]} ticks={[0, 0.35, 0.55, 0.75, 1]} {...axis} />
        <ReferenceLine y={0.75} stroke="var(--sev-critical)" strokeOpacity={0.4} strokeDasharray="2 3" />
        <Tooltip {...tip} formatter={(v) => [v, "probability"]} labelFormatter={(_, p) => p?.[0]?.payload?.name ?? ""} />
        <Bar dataKey="p" radius={[2, 2, 0, 0]} onClick={(d: { full?: string }) => d.full && onSelect(d.full)} className="cursor-pointer">
          {data.map((d) => <Cell key={d.full} fill={SEV_VAR[d.s]} fillOpacity={selectedId && selectedId !== d.full ? 0.35 : 1} stroke={selectedId === d.full ? "var(--signal)" : "none"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function EnvironmentContext({ alert: a, className }: { alert: ScoredAlert; className?: string }) {
  const rows = [
    { l: "Temperature", cur: a.weather.tempC, base: a.climate.normalTempC, max: 40, u: "°C" },
    { l: "Rel. humidity", cur: a.weather.rh, base: a.climate.normalRh, max: 80, u: "%" },
    { l: "Wind speed", cur: a.weather.windKmh, base: 15, max: 60, u: "km/h" },
    { l: "Gusts", cur: a.weather.gustKmh, base: 24, max: 80, u: "km/h" },
  ];
  return (
    <div className={cn(className)}>
      <div className="mb-2 flex items-center justify-between"><span className="eyebrow">Environmental context</span>
        <span className="flex gap-3 text-[10px] text-muted-foreground"><span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-sm bg-signal" />Current</span><span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-sm bg-muted-foreground/40" />Baseline</span></span></div>
      {rows.map((r) => (
        <div key={r.l} className="grid grid-cols-[88px_1fr_56px] items-center gap-2 py-1">
          <span className="text-[11px] text-muted-foreground">{r.l}</span>
          <div className="relative h-3">
            <div className="absolute top-0 h-1 rounded-full bg-muted-foreground/35" style={{ width: `${Math.min(100, (r.base / r.max) * 100)}%` }} />
            <div className="absolute top-1.5 h-1 rounded-full bg-signal" style={{ width: `${Math.min(100, (r.cur / r.max) * 100)}%` }} />
          </div>
          <span className="text-right font-mono text-[11px] tnum">{r.cur}<span className="text-muted-foreground">/{r.base}</span></span>
        </div>
      ))}
    </div>
  );
}
