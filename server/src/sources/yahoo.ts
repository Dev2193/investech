/** Price history from Yahoo Finance's public chart endpoint (keyless, unofficial). */
import { cached } from "../lib/cache.js";
import { ApiError } from "../lib/errors.js";
import { TICKER_RE, fetchUpstream } from "../lib/http.js";
import { createUpstreamLimiter } from "../lib/limiter.js";

const limiter = createUpstreamLimiter("Yahoo Finance", 5, 1000);
const RANGES = new Set(["1mo", "3mo", "6mo", "1y", "2y", "5y"]);
const INTERVALS = new Set(["1d", "1wk", "1mo"]);

interface YahooChart {
  chart?: {
    result?: {
      timestamp?: number[];
      meta?: Record<string, string | number | undefined>;
      indicators?: { adjclose?: { adjclose?: (number | null)[] }[]; quote?: { close?: (number | null)[] }[] };
    }[];
  };
}

export function chart(params: Record<string, string>) {
  const symbol = (params.symbol || "").toUpperCase().replace(/\./g, "-");
  const range = params.range || "1y";
  const interval = params.interval || "1d";
  if (!TICKER_RE.test(symbol) || !RANGES.has(range) || !INTERVALS.has(interval)) {
    throw new ApiError("bad_request", "Invalid price request.", "yahoo");
  }
  return cached(`yahoo:${symbol}:${range}:${interval}`, 15 * 60_000, async () => {
    await limiter.acquire().catch(() => {
      throw new ApiError("rate_limited", "Price data request budget is busy. Try again shortly.", "yahoo");
    });
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
    const res = await fetchUpstream("Yahoo Finance", url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; InvesTech.AI research)", Accept: "application/json" },
    });
    const j = (await res.json()) as YahooChart;
    const r = j?.chart?.result?.[0];
    if (!r) throw new ApiError("not_found", `No price history for ${symbol}.`, "yahoo");
    const ts = r.timestamp ?? [];
    const closes = r.indicators?.adjclose?.[0]?.adjclose ?? r.indicators?.quote?.[0]?.close ?? [];
    const points = ts
      .map((t, i) => ({ date: new Date(t * 1000).toISOString().slice(0, 10), close: closes[i] }))
      .filter((p): p is { date: string; close: number } => typeof p.close === "number");
    return {
      symbol,
      currency: r.meta?.currency ?? null,
      price: r.meta?.regularMarketPrice ?? (points.length ? points[points.length - 1].close : null),
      previousClose: r.meta?.chartPreviousClose ?? null,
      exchange: r.meta?.fullExchangeName ?? null,
      name: r.meta?.longName ?? r.meta?.shortName ?? null,
      asOf: r.meta?.regularMarketTime ? new Date(Number(r.meta.regularMarketTime) * 1000).toISOString() : null,
      points,
    };
  });
}

export const yahooRoutes: Record<string, (p: Record<string, string>) => Promise<unknown>> = { chart };
