import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { ALERTS, type Region, type ScoredAlert } from "./data";
import type { Severity } from "./scoring";

export type SortKey = "risk" | "time";
interface Store {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  region: Region;
  setRegion: (r: Region) => void;
  query: string;
  setQuery: (q: string) => void;
  sevFilter: Severity[];
  toggleSev: (s: Severity) => void;
  sort: SortKey;
  setSort: (s: SortKey) => void;
}
const Ctx = createContext<Store | null>(null);

export function FireWatchProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<string | null>("FW-2610-001");
  const [region, setRegion] = useState<Region>("all");
  const [query, setQuery] = useState("");
  const [sevFilter, setSevFilter] = useState<Severity[]>(["critical", "high", "medium", "low"]);
  const [sort, setSort] = useState<SortKey>("risk");
  const value = useMemo<Store>(() => ({
    selectedId, setSelectedId, region, setRegion, query, setQuery, sevFilter, sort, setSort,
    toggleSev: (s) => setSevFilter((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s])),
  }), [selectedId, region, query, sevFilter, sort]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFW() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useFW outside provider");
  return c;
}

export function filterAlerts(list: ScoredAlert[], s: Pick<Store, "region" | "query" | "sevFilter" | "sort">) {
  const q = s.query.trim().toLowerCase();
  return list
    .filter((a) => s.region === "all" || a.state === s.region)
    .filter((a) => s.sevFilter.includes(a.severity))
    .filter((a) => !q || `${a.id} ${a.name} ${a.county} ${a.state}`.toLowerCase().includes(q))
    .sort((a, b) => (s.sort === "risk" ? b.probability - a.probability : b.acqTime.localeCompare(a.acqTime)));
}

export function useRegionAlerts() {
  const { region } = useFW();
  return ALERTS.filter((a) => region === "all" || a.state === region);
}
