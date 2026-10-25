// Simplified, hand-digitised outlines of the US West Coast (approximate, for visualisation).
export const LON0 = -140, LON1 = -104, LAT0 = 31, LAT1 = 50.5, K = 40, COS = 0.755;
export const W = (LON1 - LON0) * COS * K;
export const H = (LAT1 - LAT0) * K;
export const proj = (lon: number, lat: number): [number, number] => [(lon - LON0) * COS * K, (LAT1 - lat) * K];

type P = [number, number];
const COAST: P[] = [
  [-123.3, 50.5], [-123.2, 49.0], [-122.75, 48.99], [-122.5, 48.4], [-122.4, 47.9], [-122.35, 47.6], [-122.5, 47.3], [-122.9, 47.1], [-123.0, 47.45],
  [-122.7, 47.9], [-123.1, 48.15], [-123.9, 48.2], [-124.7, 48.38], [-124.6, 47.9], [-124.2, 47.1], [-124.1, 46.9], [-124.0, 46.3],
  [-123.95, 45.6], [-124.05, 44.6], [-124.15, 43.6], [-124.45, 42.85], [-124.25, 42.0], [-124.2, 41.7], [-124.1, 40.9], [-124.4, 40.4],
  [-123.8, 39.6], [-123.7, 38.95], [-123.0, 38.3], [-122.5, 37.8], [-122.5, 37.2], [-122.0, 36.95], [-121.85, 36.6], [-121.5, 36.0],
  [-120.9, 35.4], [-120.65, 34.6], [-120.0, 34.45], [-119.2, 34.15], [-118.5, 34.03], [-118.4, 33.8], [-117.9, 33.6], [-117.3, 33.05],
  [-117.12, 32.53], [-116.85, 31.9], [-116.6, 31.0],
];
export const LAND: P[] = [...COAST, [-114.9, 31.0], [-114.8, 31.6], [-113.0, 31.2], [-111.0, 31.0], [-104, 31.0], [-104, 50.5]];

export const BORDERS: { pts: P[]; major?: boolean }[] = [
  { pts: [[-124.25, 42.0], [-117.03, 42.0], [-111.05, 42.0]] }, // OR/CA/NV - ID/UT
  { pts: [[-120.0, 42.0], [-120.0, 39.0], [-114.63, 35.0], [-114.57, 34.9], [-114.4, 34.1], [-114.72, 33.0], [-114.72, 32.72]] },
  { pts: [[-124.0, 46.27], [-123.0, 46.12], [-122.8, 45.6], [-121.2, 45.65], [-119.5, 45.92], [-119.0, 46.0], [-116.92, 46.0]] },
  { pts: [[-116.92, 46.0], [-116.48, 45.5], [-116.9, 44.3], [-117.03, 43.7], [-117.03, 42.0]] },
  { pts: [[-117.04, 46.0], [-117.04, 49.0]] },
  { pts: [[-114.05, 42.0], [-114.05, 37.0], [-114.05, 36.1]] },
  { pts: [[-114.05, 37.0], [-109.05, 37.0], [-109.05, 31.3]] },
  { pts: [[-111.05, 42.0], [-111.05, 44.5], [-112.8, 44.4], [-113.4, 45.0], [-114.5, 45.6], [-114.6, 46.6], [-116.05, 47.9], [-116.05, 49.0]] },
  { pts: [[-111.05, 41.0], [-109.05, 41.0], [-104.05, 41.0]] },
  { pts: [[-109.05, 41.0], [-109.05, 37.0]] },
  { pts: [[-111.05, 45.0], [-104.05, 45.0]] },
  { pts: [[-117.12, 32.53], [-114.72, 32.72], [-111.07, 31.33], [-108.2, 31.33], [-108.2, 31.0]], major: true },
  { pts: [[-123.2, 49.0], [-104, 49.0]], major: true },
];

export const STATE_LABELS: { t: string; lon: number; lat: number; dim?: boolean }[] = [
  { t: "CALIFORNIA", lon: -119.6, lat: 36.9 }, { t: "OREGON", lon: -120.5, lat: 44.1 }, { t: "WASHINGTON", lon: -120.3, lat: 47.5 },
  { t: "NEVADA", lon: -116.9, lat: 39.2, dim: true }, { t: "IDAHO", lon: -114.4, lat: 43.6, dim: true }, { t: "UTAH", lon: -111.6, lat: 39.3, dim: true },
  { t: "ARIZONA", lon: -111.7, lat: 34.2, dim: true }, { t: "BRITISH COLUMBIA", lon: -119.0, lat: 49.8, dim: true }, { t: "PACIFIC OCEAN", lon: -130.5, lat: 39.5, dim: true },
];
export const CITIES: { t: string; lon: number; lat: number }[] = [
  { t: "Seattle", lon: -122.33, lat: 47.6 }, { t: "Spokane", lon: -117.42, lat: 47.66 }, { t: "Portland", lon: -122.68, lat: 45.52 },
  { t: "Eugene", lon: -123.09, lat: 44.05 }, { t: "Bend", lon: -121.31, lat: 44.06 }, { t: "Medford", lon: -122.87, lat: 42.33 },
  { t: "Redding", lon: -122.39, lat: 40.59 }, { t: "Sacramento", lon: -121.49, lat: 38.58 }, { t: "San Francisco", lon: -122.42, lat: 37.77 },
  { t: "Fresno", lon: -119.79, lat: 36.74 }, { t: "Los Angeles", lon: -118.24, lat: 34.05 }, { t: "San Diego", lon: -117.16, lat: 32.72 },
  { t: "Reno", lon: -119.81, lat: 39.53 }, { t: "Boise", lon: -116.2, lat: 43.62 }, { t: "Las Vegas", lon: -115.14, lat: 36.17 },
];

// Procedural terrain contours around major ranges.
const RANGES = [
  { lon: -119.4, lat: 37.6, rx: 0.9, ry: 3.0, rot: -32, n: 7, s: 1 }, // Sierra Nevada
  { lon: -121.7, lat: 45.2, rx: 0.8, ry: 3.4, rot: 4, n: 6, s: 2 }, // Cascades
  { lon: -123.1, lat: 41.4, rx: 1.0, ry: 1.2, rot: 0, n: 5, s: 3 }, // Klamath
  { lon: -118.0, lat: 34.35, rx: 1.6, ry: 0.4, rot: -8, n: 4, s: 4 }, // Transverse
  { lon: -115.3, lat: 44.6, rx: 1.6, ry: 1.9, rot: 10, n: 6, s: 5 }, // Idaho batholith
  { lon: -120.5, lat: 48.3, rx: 1.3, ry: 0.9, rot: 0, n: 5, s: 6 }, // North Cascades
  { lon: -122.6, lat: 39.4, rx: 0.5, ry: 1.6, rot: -20, n: 4, s: 7 }, // Coast ranges
  { lon: -111.6, lat: 40.6, rx: 0.6, ry: 1.6, rot: 0, n: 5, s: 8 }, // Wasatch
];
export function contourPaths(): string[] {
  const out: string[] = [];
  for (const r of RANGES) {
    const c = Math.cos((r.rot * Math.PI) / 180), s = Math.sin((r.rot * Math.PI) / 180);
    for (let i = 1; i <= r.n; i++) {
      const f = i / r.n;
      let d = "";
      for (let k = 0; k <= 64; k++) {
        const t = (k / 64) * Math.PI * 2;
        const noise = 1 + 0.16 * Math.sin(3 * t + r.s * 1.7 + i * 0.4) + 0.08 * Math.sin(7 * t + r.s);
        const ex = Math.cos(t) * r.rx * f * noise, ey = Math.sin(t) * r.ry * f * noise;
        const [x, y] = proj(r.lon + (ex * c - ey * s) / COS, r.lat + (ex * s + ey * c));
        d += `${k ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
      }
      out.push(d + "Z");
    }
  }
  return out;
}
export const toPath = (pts: P[], close = false) => pts.map(([lo, la], i) => { const [x, y] = proj(lo, la); return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`; }).join("") + (close ? "Z" : "");

export function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

export const REGION_VIEW = {
  all: { lon: -120.6, lat: 40.6, z: 1.55 },
  CA: { lon: -119.6, lat: 37.2, z: 2.0 },
  OR: { lon: -121.6, lat: 44.0, z: 2.8 },
  WA: { lon: -120.6, lat: 47.4, z: 2.8 },
} as const;
