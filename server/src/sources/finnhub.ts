/** Finnhub free tier (https://finnhub.io/docs/api): 60 calls/minute per key. */
import { config } from "../config.js";
import { cached } from "../lib/cache.js";
import { ApiError } from "../lib/errors.js";
import { DATE_RE, TICKER_RE, fetchUpstream } from "../lib/http.js";
import { createUpstreamLimiter } from "../lib/limiter.js";

// Stay under the free tier's 60/min and 30/sec limits.
const limiter = createUpstreamLimiter("Finnhub", 55, 60_000, 20_000);
const PATHS = new Set(["quote", "stock/profile2", "stock/peers", "stock/recommendation", "company-news", "stock/metric"]);

async function call(path: string, params: Record<string, string>) {
  if (!PATHS.has(path)) throw new ApiError("bad_request", `Unsupported Finnhub endpoint "${path}".`, "finnhub");
  const key = config.finnhubApiKey;
  if (!key) {
    throw new ApiError(
      "missing_key",
      "Finnhub API key not configured. Get a free key at https://finnhub.io/register and set FINNHUB_API_KEY on the API server.",
      "finnhub",
    );
  }
  const qs = new URLSearchParams();
  const symbol = (params.symbol || "").toUpperCase();
  if (!TICKER_RE.test(symbol)) throw new ApiError("bad_request", "Invalid symbol.", "finnhub");
  qs.set("symbol", symbol);
  if (path === "company-news") {
    if (!DATE_RE.test(params.from || "") || !DATE_RE.test(params.to || "")) throw new ApiError("bad_request", "Invalid news date range.", "finnhub");
    qs.set("from", params.from);
    qs.set("to", params.to);
  }
  if (path === "stock/metric") qs.set("metric", "all");
  return cached(`finnhub:${path}:${qs.toString()}`, 15 * 60_000, async () => {
    await limiter.acquire().catch(() => {
      throw new ApiError("rate_limited", "Finnhub free-tier budget (60/min) is used up. Try again in a minute.", "finnhub");
    });
    qs.set("token", key);
    const res = await fetchUpstream("Finnhub", `https://finnhub.io/api/v1/${path}?${qs.toString()}`);
    const data = (await res.json()) as unknown;
    if (path === "company-news" && Array.isArray(data)) {
      return data.slice(0, 60).map((n: Record<string, unknown>) => ({
        datetime: n.datetime,
        headline: n.headline,
        summary: typeof n.summary === "string" ? n.summary.slice(0, 400) : "",
        source: n.source,
        url: n.url,
      }));
    }
    return data;
  });
}

export const finnhubRoutes: Record<string, (p: Record<string, string>) => Promise<unknown>> = Object.fromEntries(
  [...PATHS].map((p) => [p, (params: Record<string, string>) => call(p, params)]),
);
