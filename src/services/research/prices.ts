import { researchRequest } from "./transport";
import type { PricePoint } from "./types";

/** Price history via the backend (Yahoo Finance public chart endpoint, keyless). */
export interface PriceHistory {
  symbol: string;
  currency: string | null;
  price: number | null;
  previousClose: number | null;
  exchange: string | null;
  name: string | null;
  asOf: string | null;
  points: PricePoint[];
}

export const getPriceHistory = (symbol: string, range = "1y", interval = "1d") =>
  researchRequest<PriceHistory>("yahoo", "chart", { symbol, range, interval });

/** Total return over the trailing `days` calendar days (null if history is too short). */
export function trailingReturn(points: PricePoint[], days: number): number | null {
  if (points.length < 2) return null;
  const last = points[points.length - 1];
  const cutoff = Date.parse(last.date) - days * 86_400_000;
  const start = [...points].reverse().find((p) => Date.parse(p.date) <= cutoff);
  if (!start || start.close <= 0) return null;
  return last.close / start.close - 1;
}

export function simpleMovingAverage(points: PricePoint[], window: number): number | null {
  if (points.length < window) return null;
  const slice = points.slice(-window);
  return slice.reduce((s, p) => s + p.close, 0) / window;
}
