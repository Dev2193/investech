// Shared, runtime-agnostic request handler for the stock research data proxy.
//
// Used by:
//   - the Supabase edge function `stock-research` (Deno, production / Lovable)
//   - the Vite dev-server middleware in vite.config.ts (Node, local development)
//
// It only relies on the global `fetch` API so it runs unchanged in both runtimes.
// Secrets (API keys, SEC contact User-Agent) are read through `getEnv` and never
// reach the browser. Every response is a JSON envelope:
//   { ok: true, data } | { ok: false, code, message, source }

export type ResearchSource = "sec" | "yahoo" | "fred" | "finnhub" | "status";

export interface ResearchRequest {
  source: ResearchSource;
  path: string;
  params?: Record<string, string | number | undefined>;
}

export type ResearchErrorCode =
  | "missing_key"
  | "rate_limited"
  | "not_found"
  | "bad_request"
  | "upstream";

export type ResearchEnvelope =
  | { ok: true; data: unknown }
  | { ok: false; code: ResearchErrorCode; message: string; source: string };

export type EnvGetter = (name: string) => string | undefined;

class ProxyError extends Error {
  constructor(public code: ResearchErrorCode, message: string, public source: string) {
    super(message);
  }
}

const TICKER_RE = /^[A-Z0-9.\-^=]{1,15}$/;
const CIK_RE = /^\d{10}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------- caching
// Small in-memory cache (per warm edge instance / dev server process).
const cache = new Map<string, { expires: number; value: unknown }>();
async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const value = await fn();
  cache.set(key, { expires: Date.now() + ttlMs, value });
  if (cache.size > 300) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  return value;
}

async function fetchUpstream(source: string, url: string, init?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (e) {
    throw new ProxyError("upstream", `Could not reach ${source}: ${(e as Error).message}`, source);
  }
  if (res.status === 429) throw new ProxyError("rate_limited", `${source} rate limit reached. Try again in a minute.`, source);
  if (res.status === 404) throw new ProxyError("not_found", `${source} has no data for this request.`, source);
  if (res.status === 401 || res.status === 403) {
    throw new ProxyError("upstream", `${source} rejected the request (HTTP ${res.status}). Check the API key / plan.`, source);
  }
  if (!res.ok) throw new ProxyError("upstream", `${source} returned HTTP ${res.status}.`, source);
  return res;
}

// ---------------------------------------------------------------- SEC EDGAR
// Keyless, but SEC requires a descriptive User-Agent that includes a contact email.
// https://www.sec.gov/os/accessing-edgar-data

// us-gaap / dei concepts we keep from the (multi-MB) companyfacts payload.
const SEC_CONCEPTS = [
  "Revenues",
  "RevenueFromContractWithCustomerExcludingAssessedTax",
  "RevenueFromContractWithCustomerIncludingAssessedTax",
  "SalesRevenueNet",
  "RevenuesNetOfInterestExpense",
  "NetIncomeLoss",
  "GrossProfit",
  "OperatingIncomeLoss",
  "EarningsPerShareDiluted",
  "EarningsPerShareBasic",
  "CashAndCashEquivalentsAtCarryingValue",
  "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents",
  "LongTermDebt",
  "LongTermDebtNoncurrent",
  "LongTermDebtCurrent",
  "DebtCurrent",
  "ShortTermBorrowings",
  "CommercialPaper",
  "StockholdersEquity",
  "Assets",
  "Liabilities",
  "AssetsCurrent",
  "LiabilitiesCurrent",
  "NetCashProvidedByUsedInOperatingActivities",
  "PaymentsToAcquirePropertyPlantAndEquipment",
  "PaymentsToAcquireProductiveAssets",
  "EntityCommonStockSharesOutstanding",
];

interface SecFact {
  start?: string;
  end: string;
  val: number;
  fy?: number;
  fp?: string;
  form?: string;
  filed?: string;
}

function secHeaders(getEnv: EnvGetter): Record<string, string> {
  const ua = getEnv("SEC_USER_AGENT");
  if (!ua) {
    throw new ProxyError(
      "missing_key",
      'SEC EDGAR needs a contact User-Agent. Set the SEC_USER_AGENT secret to something like "InvesTech.AI you@yourdomain.com".',
      "sec",
    );
  }
  return { "User-Agent": ua, Accept: "application/json" };
}

async function secTickerMap(getEnv: EnvGetter) {
  return cached("sec:tickers", 12 * 3600_000, async () => {
    const res = await fetchUpstream("SEC EDGAR", "https://www.sec.gov/files/company_tickers.json", {
      headers: secHeaders(getEnv),
    });
    const json = (await res.json()) as Record<string, { cik_str: number; ticker: string; title: string }>;
    const map: Record<string, { cik: string; ticker: string; title: string }> = {};
    for (const row of Object.values(json)) {
      map[row.ticker.toUpperCase()] = {
        cik: String(row.cik_str).padStart(10, "0"),
        ticker: row.ticker.toUpperCase(),
        title: row.title,
      };
    }
    return map;
  });
}

async function handleSec(path: string, params: Record<string, string>, getEnv: EnvGetter) {
  if (path === "lookup") {
    const ticker = (params.ticker || "").toUpperCase().replace(/\./g, "-");
    if (!TICKER_RE.test(ticker)) throw new ProxyError("bad_request", "Invalid ticker.", "sec");
    const map = await secTickerMap(getEnv);
    const hit = map[ticker] || map[ticker.replace(/-/g, "")];
    if (!hit) throw new ProxyError("not_found", `Ticker ${ticker} was not found in SEC EDGAR (US-listed SEC filers only).`, "sec");
    return hit;
  }

  const cik = params.cik || "";
  if (!CIK_RE.test(cik)) throw new ProxyError("bad_request", "Invalid CIK.", "sec");

  if (path === "companyfacts") {
    return cached(`sec:facts:${cik}`, 6 * 3600_000, async () => {
      const res = await fetchUpstream("SEC EDGAR", `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, {
        headers: secHeaders(getEnv),
      });
      const json = (await res.json()) as {
        entityName?: string;
        facts?: Record<string, Record<string, { units?: Record<string, SecFact[]> }>>;
      };
      const out: Record<string, Record<string, SecFact[]>> = {};
      for (const taxonomy of ["us-gaap", "dei"]) {
        const facts = json?.facts?.[taxonomy] ?? {};
        for (const concept of SEC_CONCEPTS) {
          const units = facts[concept]?.units;
          if (!units) continue;
          out[concept] = {};
          for (const [unit, rows] of Object.entries(units as Record<string, SecFact[]>)) {
            out[concept][unit] = rows.map((r) => ({
              start: r.start,
              end: r.end,
              val: r.val,
              fy: r.fy,
              fp: r.fp,
              form: r.form,
              filed: r.filed,
            }));
          }
        }
      }
      return { cik, entityName: json?.entityName ?? null, facts: out };
    });
  }

  if (path === "submissions") {
    return cached(`sec:subs:${cik}`, 6 * 3600_000, async () => {
      const res = await fetchUpstream("SEC EDGAR", `https://data.sec.gov/submissions/CIK${cik}.json`, {
        headers: secHeaders(getEnv),
      });
      const j = (await res.json()) as Record<string, unknown> & { tickers?: string[]; exchanges?: string[] };
      return {
        cik,
        name: j.name ?? null,
        sic: j.sic ?? null,
        sicDescription: j.sicDescription ?? null,
        tickers: j.tickers ?? [],
        exchanges: j.exchanges ?? [],
        fiscalYearEnd: j.fiscalYearEnd ?? null,
        stateOfIncorporation: j.stateOfIncorporation ?? null,
        website: j.website ?? null,
      };
    });
  }

  throw new ProxyError("bad_request", `Unknown SEC path "${path}".`, "sec");
}

// ---------------------------------------------------------------- Yahoo Finance chart (prices)
// Keyless public chart endpoint (unofficial, undocumented). Used only for price history.
const YAHOO_RANGES = new Set(["1mo", "3mo", "6mo", "1y", "2y", "5y"]);
const YAHOO_INTERVALS = new Set(["1d", "1wk", "1mo"]);

async function handleYahoo(path: string, params: Record<string, string>) {
  if (path !== "chart") throw new ProxyError("bad_request", `Unknown price path "${path}".`, "yahoo");
  const symbol = (params.symbol || "").toUpperCase().replace(/\./g, "-");
  const range = params.range || "1y";
  const interval = params.interval || "1d";
  if (!TICKER_RE.test(symbol) || !YAHOO_RANGES.has(range) || !YAHOO_INTERVALS.has(interval)) {
    throw new ProxyError("bad_request", "Invalid price request.", "yahoo");
  }
  return cached(`yahoo:${symbol}:${range}:${interval}`, 15 * 60_000, async () => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
    const res = await fetchUpstream("Yahoo Finance", url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; InvesTech.AI research)", Accept: "application/json" },
    });
    interface YahooChart {
      chart?: {
        result?: {
          timestamp?: number[];
          meta?: Record<string, string | number | undefined>;
          indicators?: { adjclose?: { adjclose?: (number | null)[] }[]; quote?: { close?: (number | null)[] }[] };
        }[];
      };
    }
    const j = (await res.json()) as YahooChart;
    const r = j?.chart?.result?.[0];
    if (!r) throw new ProxyError("not_found", `No price history for ${symbol}.`, "yahoo");
    const ts: number[] = r.timestamp ?? [];
    const closes: (number | null)[] = r.indicators?.adjclose?.[0]?.adjclose ?? r.indicators?.quote?.[0]?.close ?? [];
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

// ---------------------------------------------------------------- FRED (macro data)
// Uses the official FRED API when FRED_API_KEY is set, otherwise the keyless public
// fredgraph.csv download for the same series.
const FRED_ID_RE = /^[A-Z0-9_]{1,30}$/;

async function handleFred(path: string, params: Record<string, string>, getEnv: EnvGetter) {
  if (path !== "series") throw new ProxyError("bad_request", `Unknown FRED path "${path}".`, "fred");
  const id = (params.id || "").toUpperCase();
  const start = params.start || "";
  if (!FRED_ID_RE.test(id) || (start && !DATE_RE.test(start))) {
    throw new ProxyError("bad_request", "Invalid FRED series request.", "fred");
  }
  return cached(`fred:${id}:${start}`, 6 * 3600_000, async () => {
    const key = getEnv("FRED_API_KEY");
    let observations: { date: string; value: number }[] = [];
    if (key) {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${encodeURIComponent(key)}&file_type=json${start ? `&observation_start=${start}` : ""}`;
      const res = await fetchUpstream("FRED", url);
      const j = (await res.json()) as { observations?: { date: string; value: string }[] };
      observations = (j.observations ?? [])
        .map((o: { date: string; value: string }) => ({ date: o.date, value: o.value === "." || o.value === "" ? NaN : Number(o.value) }))
        .filter((o: { value: number }) => Number.isFinite(o.value));
    } else {
      const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}${start ? `&cosd=${start}` : ""}`;
      const res = await fetchUpstream("FRED", url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; InvesTech.AI research)" } });
      const text = await res.text();
      if (!text.startsWith("observation_date") && !text.startsWith("DATE")) {
        throw new ProxyError("upstream", `FRED returned an unexpected response for ${id}.`, "fred");
      }
      observations = text
        .trim()
        .split("\n")
        .slice(1)
        .map((line) => {
          const [date, raw = ""] = line.split(",");
          const v = raw.trim();
          // FRED marks missing observations with "" or "." — skip them instead of reading 0.
          return { date, value: v === "" || v === "." ? NaN : Number(v) };
        })
        .filter((o) => DATE_RE.test(o.date) && Number.isFinite(o.value));
    }
    if (!observations.length) throw new ProxyError("not_found", `FRED series ${id} has no observations.`, "fred");
    return { id, observations };
  });
}

// ---------------------------------------------------------------- Finnhub (free tier)
// https://finnhub.io/docs/api — free key, 60 calls/minute.
const FINNHUB_PATHS = new Set(["quote", "stock/profile2", "stock/peers", "stock/recommendation", "company-news", "stock/metric"]);

async function handleFinnhub(path: string, params: Record<string, string>, getEnv: EnvGetter) {
  if (!FINNHUB_PATHS.has(path)) throw new ProxyError("bad_request", `Unsupported Finnhub endpoint "${path}".`, "finnhub");
  const key = getEnv("FINNHUB_API_KEY");
  if (!key) {
    throw new ProxyError(
      "missing_key",
      "Finnhub API key not configured. Get a free key at https://finnhub.io/register and set the FINNHUB_API_KEY secret.",
      "finnhub",
    );
  }
  const qs = new URLSearchParams();
  const symbol = (params.symbol || "").toUpperCase();
  if (!TICKER_RE.test(symbol)) throw new ProxyError("bad_request", "Invalid symbol.", "finnhub");
  qs.set("symbol", symbol);
  if (path === "company-news") {
    if (!DATE_RE.test(params.from || "") || !DATE_RE.test(params.to || "")) {
      throw new ProxyError("bad_request", "Invalid news date range.", "finnhub");
    }
    qs.set("from", params.from);
    qs.set("to", params.to);
  }
  if (path === "stock/metric") qs.set("metric", "all");
  return cached(`finnhub:${path}:${qs.toString()}`, 15 * 60_000, async () => {
    qs.set("token", key);
    const res = await fetchUpstream("Finnhub", `https://finnhub.io/api/v1/${path}?${qs.toString()}`);
    const data = await res.json();
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

// ---------------------------------------------------------------- entry point
export async function handleResearchRequest(req: ResearchRequest, getEnv: EnvGetter): Promise<ResearchEnvelope> {
  try {
    if (!req || typeof req !== "object" || typeof req.path !== "string") {
      throw new ProxyError("bad_request", "Malformed request.", "proxy");
    }
    const params: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.params ?? {})) {
      if (v !== undefined && v !== null) params[k] = String(v).slice(0, 64);
    }
    let data: unknown;
    switch (req.source) {
      case "sec":
        data = await handleSec(req.path, params, getEnv);
        break;
      case "yahoo":
        data = await handleYahoo(req.path, params);
        break;
      case "fred":
        data = await handleFred(req.path, params, getEnv);
        break;
      case "finnhub":
        data = await handleFinnhub(req.path, params, getEnv);
        break;
      case "status":
        // Lets the UI know which optional keys are configured (never returns the values).
        data = {
          finnhub: Boolean(getEnv("FINNHUB_API_KEY")),
          fredApiKey: Boolean(getEnv("FRED_API_KEY")),
          secUserAgent: Boolean(getEnv("SEC_USER_AGENT")),
        };
        break;
      default:
        throw new ProxyError("bad_request", "Unknown data source.", "proxy");
    }
    return { ok: true, data };
  } catch (e) {
    if (e instanceof ProxyError) return { ok: false, code: e.code, message: e.message, source: e.source };
    return { ok: false, code: "upstream", message: (e as Error)?.message ?? "Unknown error", source: req?.source ?? "proxy" };
  }
}
