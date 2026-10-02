import { researchRequest } from "./transport";
import type { SeriesPoint } from "./types";

/** FRED (Federal Reserve Bank of St. Louis). Keyless CSV by default, API if FRED_API_KEY is set. */
export interface FredSeries {
  id: string;
  observations: SeriesPoint[];
}

export const getFredSeries = (id: string, start?: string) =>
  researchRequest<FredSeries>("fred", "series", { id, start });

export function latest(obs: SeriesPoint[]): SeriesPoint | null {
  return obs.length ? obs[obs.length - 1] : null;
}

/** Value roughly `months` before the latest observation. */
export function valueMonthsAgo(obs: SeriesPoint[], months: number): SeriesPoint | null {
  const last = latest(obs);
  if (!last) return null;
  const d = new Date(last.date);
  d.setUTCMonth(d.getUTCMonth() - months);
  const target = d.toISOString().slice(0, 10);
  return [...obs].reverse().find((o) => o.date <= target) ?? null;
}

/** Year-over-year % change of the latest observation (for index series like CPI). */
export function yoyChange(obs: SeriesPoint[]): number | null {
  const last = latest(obs);
  const prev = valueMonthsAgo(obs, 12);
  if (!last || !prev || prev.value === 0) return null;
  return last.value / prev.value - 1;
}
