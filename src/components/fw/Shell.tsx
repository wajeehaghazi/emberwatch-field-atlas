import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Activity, Database, FlaskConical, History, LayoutGrid, Radar, Search, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useFW } from "@/lib/firewatch/store";
import type { Region } from "@/lib/firewatch/data";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      <path d="M16 4c1.5 4.5 7 7.5 7 14a7 7 0 1 1-14 0c0-3.6 2-5.6 3.6-7.6.3 2 1.2 3.4 2.6 4C15.4 10.5 15 7.2 16 4Z" stroke="var(--sev-high)" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="16" cy="19.5" r="2.2" fill="var(--signal)" />
      <path d="M4 10a16 16 0 0 1 6-6M2 6.5A20 20 0 0 1 6.5 2" stroke="var(--signal)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M16 19.5 6 9" stroke="var(--signal)" strokeWidth="1" strokeDasharray="1.5 1.5" />
    </svg>
  );
}

const NAV = [
  { to: "/", label: "Overview", icon: LayoutGrid },
  { to: "/live", label: "Live Monitoring", icon: Radar },
  { to: "/explorer", label: "Hotspot Explorer", icon: FlaskConical },
  { to: "/replay", label: "Historical Replay", icon: History },
  { to: "/evidence", label: "Evidence Integrity", icon: ShieldCheck },
  { to: "/sources", label: "Data Sources", icon: Database },
] as const;

export function Sidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r bg-surface/60 md:flex">
      <div className="flex items-center gap-2.5 border-b px-4 py-4">
        <Logo className="h-8 w-8" />
        <div>
          <div className="text-[13px] font-bold tracking-[0.12em]">FIREWATCH AI</div>
          <div className="text-[8.5px] font-semibold tracking-[0.16em] text-muted-foreground">CLIMATE INTELLIGENCE SYSTEM</div>
        </div>
      </div>
      <nav className="flex flex-col gap-0.5 p-2 pt-3">
        <div className="eyebrow px-2.5 pb-2">Workspace</div>
        {NAV.map(({ to, label, icon: I }) => {
          const active = pathname === to;
          return (
            <Link key={to} to={to} className={cn("group relative flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[13px] transition-colors", active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground")}>
              {active && <span className="absolute -left-2 top-1.5 bottom-1.5 w-[2px] rounded-full bg-signal" />}
              <I className={cn("h-4 w-4", active ? "text-signal" : "")} strokeWidth={1.6} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t p-4 text-[10px] leading-relaxed text-muted-foreground">
        <div className="eyebrow mb-1.5">Build</div>
        IEEE ClimateChain Global Hackathon 2026<br />Prototype · not for operational dispatch
      </div>
    </aside>
  );
}

export function MobileNav() {
  const { pathname } = useLocation();
  return (
    <nav className="scroll-thin flex gap-1 overflow-x-auto border-b px-3 py-2 md:hidden">
      {NAV.map(({ to, label, icon: I }) => (
        <Link key={to} to={to} className={cn("flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs", pathname === to ? "bg-accent text-signal" : "text-muted-foreground")}><I className="h-3.5 w-3.5" />{label}</Link>
      ))}
    </nav>
  );
}

const TITLES: Record<string, string> = { "/": "Overview", "/live": "Live Monitoring", "/explorer": "Hotspot Explorer", "/replay": "Historical Replay", "/evidence": "Evidence Integrity", "/sources": "Data Sources" };

export function CommandBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { region, setRegion, query, setQuery } = useFW();
  const isReplay = pathname === "/replay";
  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-x-4 gap-y-2 border-b bg-background/90 px-4 py-2.5 backdrop-blur md:px-5">
      <div className="flex items-center gap-2 md:hidden"><Logo className="h-6 w-6" /><span className="text-xs font-bold tracking-[0.12em]">FIREWATCH AI</span></div>
      <div className="hidden md:block">
        <div className="eyebrow">Workspace</div>
        <h1 className="text-sm font-semibold">{TITLES[pathname] ?? "FireWatch"}</h1>
      </div>
      <div className="mx-1 hidden h-7 w-px bg-border md:block" />
      <select aria-label="Region" value={region} onChange={(e) => setRegion(e.target.value as Region)} className="h-8 rounded-sm border bg-surface px-2 text-xs text-foreground outline-none focus:border-signal">
        <option value="all">Pacific West · All</option><option value="CA">California</option><option value="OR">Oregon</option><option value="WA">Washington</option>
      </select>
      <label className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-sm border bg-surface px-2.5 text-xs focus-within:border-signal md:max-w-72">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search alert ID, place, county…" className="w-full bg-transparent outline-none placeholder:text-muted-foreground" />
      </label>
      <div className="ml-auto flex items-center gap-3">
        <div className="flex rounded-sm border bg-surface p-0.5 text-[11px] font-medium">
          <button onClick={() => navigate({ to: "/live" })} className={cn("flex items-center gap-1.5 rounded-[3px] px-2.5 py-1", !isReplay ? "bg-accent text-foreground" : "text-muted-foreground")}><span className={cn("h-1.5 w-1.5 rounded-full", !isReplay ? "bg-sev-critical pulse-dot" : "bg-muted-foreground")} />Live</button>
          <button onClick={() => navigate({ to: "/replay" })} className={cn("rounded-[3px] px-2.5 py-1", isReplay ? "bg-accent text-foreground" : "text-muted-foreground")}>Replay</button>
        </div>
        <div className="hidden text-right lg:block">
          <div className="eyebrow">Freshness</div>
          <div className="font-mono text-[11px] tnum">Pass 11:18 UTC · demo</div>
        </div>
        <Link to="/sources" className="hidden items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground lg:flex">
          <Activity className="h-3.5 w-3.5 text-sev-medium" />FIRMS key not set
        </Link>
        <span className="rounded-sm border border-sev-medium/50 bg-sev-medium/10 px-2 py-1 font-mono text-[10px] font-semibold tracking-wider text-sev-medium">DEMO DATA</span>
      </div>
    </header>
  );
}

export function PanelHeader({ title, meta, children }: { title: string; meta?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b px-3.5 py-2.5">
      <div className="min-w-0">
        <div className="eyebrow">{title}</div>
        {meta && <div className="mt-0.5 text-[11px] text-muted-foreground">{meta}</div>}
      </div>
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  );
}
