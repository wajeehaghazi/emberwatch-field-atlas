import { computeRisk, MODEL_VERSION, type Severity, type VIIRSConfidence } from "./scoring";

// DEMONSTRATION DATA — plausible but simulated FIRMS-style VIIRS records.
export type Region = "all" | "CA" | "OR" | "WA";

export interface RawAlert {
  id: string;
  name: string;
  county: string;
  state: "CA" | "OR" | "WA";
  lat: number;
  lon: number;
  acqDate: string;
  acqTime: string; // HHMM UTC
  satellite: "N20" | "N21";
  instrument: "VIIRS";
  frp: number;
  brightTi4: number; // K
  confidence: VIIRSConfidence;
  detections: number;
  persistenceHours: number;
  weather: { tempC: number; rh: number; windKmh: number; gustKmh: number; windDir: number };
  climate: { tempAnomC: number; precipAnomPct: number; normalRh: number; normalTempC: number };
}

type Row = [string, string, string, RawAlert["state"], number, number, string, RawAlert["satellite"], number, number, VIIRSConfidence, number, number, number, number, number, number, number, number, number];
const rows: Row[] = [
  ["FW-2610-001", "Dixie Ridge", "Plumas Co.", "CA", 40.05, -121.05, "0912", "N21", 148.2, 367.1, "h", 22, 40, 29, 14, 38, 56, 45, 4.1, -62],
  ["FW-2610-002", "Snow Mountain", "Glenn Co.", "CA", 39.62, -122.78, "0954", "N20", 96.4, 351.6, "h", 17, 30, 27, 18, 31, 47, 30, 3.2, -48],
  ["FW-2610-003", "Kaweah Basin", "Tulare Co.", "CA", 36.35, -118.62, "0912", "N21", 64.0, 344.2, "n", 11, 20, 26, 21, 22, 34, 60, 2.6, -40],
  ["FW-2610-004", "San Gabriel Front", "Los Angeles Co.", "CA", 34.35, -118.05, "0954", "N20", 121.3, 360.4, "h", 15, 18, 31, 9, 46, 72, 50, 3.8, -70],
  ["FW-2610-005", "Salmon River", "Siskiyou Co.", "CA", 41.62, -123.35, "0912", "N21", 52.1, 339.0, "n", 9, 26, 22, 26, 18, 28, 300, 1.8, -35],
  ["FW-2610-006", "Shasta Lake", "Shasta Co.", "CA", 40.82, -122.32, "0954", "N20", 33.4, 332.5, "n", 6, 12, 30, 20, 20, 30, 330, 2.0, -30],
  ["FW-2610-007", "Laguna Mountains", "San Diego Co.", "CA", 32.9, -116.62, "0912", "N21", 18.2, 322.8, "l", 3, 4, 24, 32, 14, 22, 270, 1.0, -20],
  ["FW-2610-008", "Merced Canyon", "Mariposa Co.", "CA", 37.55, -119.95, "0954", "N20", 41.7, 336.3, "n", 8, 14, 25, 23, 17, 26, 240, 2.2, -38],
  ["FW-2610-009", "North Umpqua", "Douglas Co.", "OR", 43.18, -122.6, "1036", "N21", 74.5, 347.9, "h", 13, 34, 21, 24, 26, 38, 70, 2.9, -45],
  ["FW-2610-010", "Deschutes Plateau", "Deschutes Co.", "OR", 43.95, -121.4, "1036", "N20", 27.3, 330.1, "n", 5, 8, 18, 28, 16, 24, 290, 1.2, -25],
  ["FW-2610-011", "Rogue Valley", "Jackson Co.", "OR", 42.42, -123.0, "1036", "N21", 12.6, 318.4, "l", 2, 2, 20, 41, 9, 15, 200, 0.5, -10],
  ["FW-2610-012", "Okanogan Highlands", "Okanogan Co.", "WA", 48.42, -119.9, "1118", "N21", 88.9, 349.3, "h", 14, 28, 19, 19, 33, 49, 20, 3.0, -52],
  ["FW-2610-013", "Yakima Canyon", "Kittitas Co.", "WA", 46.75, -120.48, "1118", "N20", 23.1, 326.7, "n", 4, 6, 17, 30, 21, 31, 280, 1.4, -28],
  ["FW-2610-014", "Mt Hood Foothills", "Hood River Co.", "OR", 45.25, -121.7, "1036", "N20", 9.4, 312.2, "l", 2, 0, 14, 52, 8, 12, 250, 0.2, 5],
  ["FW-2610-015", "Big Sur Coast", "Monterey Co.", "CA", 36.12, -121.6, "0954", "N21", 15.3, 320.9, "n", 3, 5, 19, 48, 12, 19, 310, 0.8, -15],
  ["FW-2610-016", "Desolation Rim", "El Dorado Co.", "CA", 38.85, -120.3, "0912", "N20", 58.6, 342.4, "n", 10, 22, 23, 17, 27, 40, 225, 2.7, -50],
];

export const RAW_ALERTS: RawAlert[] = rows.map((r) => ({
  id: r[0], name: r[1], county: r[2], state: r[3], lat: r[4], lon: r[5], acqDate: "2026-10-25", acqTime: r[6],
  satellite: r[7], instrument: "VIIRS", frp: r[8], brightTi4: r[9], confidence: r[10], detections: r[11], persistenceHours: r[12],
  weather: { tempC: r[13], rh: r[14], windKmh: r[15], gustKmh: r[16], windDir: r[17] },
  climate: { tempAnomC: r[18], precipAnomPct: r[19], normalRh: Math.min(70, r[14] + 18 + Math.round(r[18] * 3)), normalTempC: +(r[13] - r[18]).toFixed(1) },
}));

export const REPLAY_DAYS = ["Oct 18", "Oct 19", "Oct 20", "Oct 21", "Oct 22", "Oct 23", "Oct 24", "Oct 25"];

export function historyFor(a: RawAlert): number[] {
  const onset = 7 - Math.min(7, Math.round(a.persistenceHours / 6));
  return REPLAY_DAYS.map((_, i) => (i < onset ? 0 : Math.max(1, Math.round(a.detections * Math.pow((i - onset + 1) / (8 - onset), 1.3)))));
}

export function scoreAlert(a: RawAlert, override?: Partial<{ frp: number; detections: number; persistenceHours: number }>) {
  const frp = override?.frp ?? a.frp;
  const detections = override?.detections ?? a.detections;
  const persistenceHours = override?.persistenceHours ?? a.persistenceHours;
  const risk = computeRisk({ frp, detections, persistenceHours, windKmh: a.weather.windKmh, rh: a.weather.rh, tempAnomC: a.climate.tempAnomC, precipAnomPct: a.climate.precipAnomPct, confidence: a.confidence });
  return { ...a, frp, detections, persistenceHours, ...risk, history: historyFor(a) };
}
export type ScoredAlert = ReturnType<typeof scoreAlert>;

export const ALERTS: ScoredAlert[] = RAW_ALERTS.map((a) => scoreAlert(a));

export function replayFrame(day: number): ScoredAlert[] {
  return RAW_ALERTS.flatMap((a) => {
    const h = historyFor(a);
    if (!h[day]) return [];
    const hd = h[day] ?? 0;
    const ratio = hd / a.detections;
    const firstDay = h.findIndex((v) => v > 0);
    return [scoreAlert(a, { frp: +(a.frp * ratio).toFixed(1), detections: hd, persistenceHours: Math.min(a.persistenceHours, (day - firstDay) * 24) })];
  });
}

export function explain(a: ScoredAlert): string {
  const [f1, f2, f3] = a.topFactors as [typeof a.topFactors[number], typeof a.topFactors[number], typeof a.topFactors[number]];
  const dir = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(a.weather.windDir / 45) % 8];
  return `${a.name} shows ${a.detections} VIIRS detections at ${a.frp.toFixed(1)} MW FRP, active for ${a.persistenceHours} h. ` +
    `The score is driven mainly by ${f1.label.toLowerCase()} (${f1.value}), ${f2.label.toLowerCase()} (${f2.value}) and ${f3.label.toLowerCase()} (${f3.value}). ` +
    `${dir} winds at ${a.weather.windKmh} km/h with ${a.weather.rh}% humidity ${a.weather.rh < 20 ? "favour continued activity" : "moderate the outlook"}; ` +
    `precipitation runs ${a.climate.precipAnomPct}% against the NASA POWER baseline. Prototype estimate of 24 h persistence/intensification — not a spread forecast.`;
}

export function evidencePayload(a: ScoredAlert) {
  return {
    alert_id: a.id, latitude: a.lat, longitude: a.lon, acq_date: a.acqDate, acq_time: a.acqTime,
    satellite: a.satellite, instrument: a.instrument, frp_mw: a.frp, bright_ti4_k: a.brightTi4, viirs_confidence: a.confidence,
    weather: a.weather, model_version: MODEL_VERSION, probability: +a.probability.toFixed(4), severity: a.severity,
    sources: [`FIRMS:VIIRS_${a.satellite === "N21" ? "NOAA21" : "NOAA20"}_NRT (demo)`, "Open-Meteo:forecast/current (demo)", "NASA_POWER:climatology (demo)"],
  };
}

export const SEV_ORDER: Severity[] = ["critical", "high", "medium", "low"];
export const SEV_LABEL: Record<Severity, string> = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };
export const SEV_VAR: Record<Severity, string> = { critical: "var(--sev-critical)", high: "var(--sev-high)", medium: "var(--sev-medium)", low: "var(--sev-low)" };
export const SEV_TEXT: Record<Severity, string> = { critical: "text-sev-critical", high: "text-sev-high", medium: "text-sev-medium", low: "text-sev-low" };
export const SEV_BG: Record<Severity, string> = { critical: "bg-sev-critical", high: "bg-sev-high", medium: "bg-sev-medium", low: "bg-sev-low" };
export const SEV_RANGE: Record<Severity, string> = { critical: "0.75–1.00", high: "0.55–0.75", medium: "0.35–0.55", low: "0.00–0.35" };

export const fmtTime = (t: string) => `${t.slice(0, 2)}:${t.slice(2)} UTC`;
