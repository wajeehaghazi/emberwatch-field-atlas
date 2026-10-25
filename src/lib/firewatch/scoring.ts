// Transparent prototype scoring — a hand-weighted logistic formula, NOT a trained model.
export type Severity = "critical" | "high" | "medium" | "low";
export type VIIRSConfidence = "l" | "n" | "h"; // FIRMS VIIRS categories: low / nominal / high

export const MODEL_VERSION = "fw-proto-score-0.3 (weighted logistic · not trained)";

export interface RiskFeatures {
  frp: number; // MW
  detections: number; // VIIRS pixels in cluster
  persistenceHours: number; // hours with prior detections in last 48h
  windKmh: number;
  rh: number; // %
  tempAnomC: number; // vs NASA POWER baseline
  precipAnomPct: number; // vs NASA POWER baseline (negative = deficit)
  confidence: VIIRSConfidence;
}

export interface Contribution {
  key: string;
  label: string;
  value: string;
  weight: number;
  contribution: number;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const INTERCEPT = -3.75;

export function classify(p: number): Severity {
  if (p >= 0.75) return "critical";
  if (p >= 0.55) return "high";
  if (p >= 0.35) return "medium";
  return "low";
}

export function computeRisk(f: RiskFeatures) {
  const conf = f.confidence === "h" ? 1 : f.confidence === "n" ? 0.5 : 0;
  const parts: Contribution[] = [
    { key: "frp", label: "Fire radiative power", value: `${f.frp.toFixed(1)} MW`, weight: 1.6, contribution: 1.6 * (Math.log1p(f.frp) / Math.log1p(200)) },
    { key: "det", label: "Cluster size", value: `${f.detections} detections`, weight: 1.2, contribution: 1.2 * clamp(f.detections / 25, 0, 1) },
    { key: "pers", label: "Persistence", value: `${f.persistenceHours} h active`, weight: 1.1, contribution: 1.1 * clamp(f.persistenceHours / 48, 0, 1) },
    { key: "wind", label: "Wind speed", value: `${f.windKmh} km/h`, weight: 1.0, contribution: clamp(f.windKmh / 50, 0, 1) },
    { key: "rh", label: "Low humidity", value: `${f.rh}% RH`, weight: 1.0, contribution: clamp((100 - f.rh) / 100, 0, 1) },
    { key: "precip", label: "Precipitation deficit", value: `${f.precipAnomPct}% vs normal`, weight: 0.6, contribution: 0.6 * clamp(-f.precipAnomPct / 60, -1, 1) },
    { key: "temp", label: "Temperature anomaly", value: `${f.tempAnomC > 0 ? "+" : ""}${f.tempAnomC.toFixed(1)} °C`, weight: 0.5, contribution: 0.5 * clamp(f.tempAnomC / 6, -1, 1) },
    { key: "conf", label: "VIIRS confidence", value: f.confidence === "h" ? "high" : f.confidence === "n" ? "nominal" : "low", weight: 0.4, contribution: 0.4 * conf },
  ];
  const logit = INTERCEPT + parts.reduce((s, p) => s + p.contribution, 0);
  const probability = 1 / (1 + Math.exp(-logit));
  const ranked = [...parts].sort((a, b) => b.contribution - a.contribution);
  return { probability, severity: classify(probability), contributions: parts, topFactors: ranked.slice(0, 3), logit };
}
