/**
 * FRED (St. Louis Fed). Uses the official API when FRED_API_KEY is set, otherwise
 * the keyless public fredgraph.csv download for the same series.
 */
import { config } from "../config.js";
import { cached } from "../lib/cache.js";
import { ApiError } from "../lib/errors.js";
import { DATE_RE, fetchUpstream } from "../lib/http.js";
import { createUpstreamLimiter } from "../lib/limiter.js";

const limiter = createUpstreamLimiter("FRED", 5, 1000);
const ID_RE = /^[A-Z0-9_]{1,30}$/;
const isMissing = (v: string) => v === "" || v === ".";

export function series(params: Record<string, string>) {
  const id = (params.id || "").toUpperCase();
  const start = params.start || "";
  if (!ID_RE.test(id) || (start && !DATE_RE.test(start))) throw new ApiError("bad_request", "Invalid FRED series request.", "fred");
  return cached(`fred:${id}:${start}`, 6 * 3_600_000, async () => {
    await limiter.acquire().catch(() => {
      throw new ApiError("rate_limited", "FRED request budget is busy. Try again shortly.", "fred");
    });
    let observations: { date: string; value: number }[];
    if (config.fredApiKey) {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${encodeURIComponent(config.fredApiKey)}&file_type=json${start ? `&observation_start=${start}` : ""}`;
      const res = await fetchUpstream("FRED", url);
      const j = (await res.json()) as { observations?: { date: string; value: string }[] };
      observations = (j.observations ?? []).map((o) => ({ date: o.date, value: isMissing(o.value.trim()) ? NaN : Number(o.value) }));
    } else {
      const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}${start ? `&cosd=${start}` : ""}`;
      const res = await fetchUpstream("FRED", url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; InvesTech.AI research)" } });
      const text = await res.text();
      if (!text.startsWith("observation_date") && !text.startsWith("DATE")) {
        throw new ApiError("upstream", `FRED returned an unexpected response for ${id}.`, "fred");
      }
      observations = text
        .trim()
        .split("\n")
        .slice(1)
        .map((line) => {
          const [date, raw = ""] = line.split(",");
          const v = raw.trim();
          return { date, value: isMissing(v) ? NaN : Number(v) };
        });
    }
    observations = observations.filter((o) => DATE_RE.test(o.date) && Number.isFinite(o.value));
    if (!observations.length) throw new ApiError("not_found", `FRED series ${id} has no observations.`, "fred");
    return { id, observations };
  });
}

export const fredRoutes: Record<string, (p: Record<string, string>) => Promise<unknown>> = { series };
