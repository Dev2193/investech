/**
 * SEC EDGAR (keyless). SEC requires a descriptive User-Agent with a contact email
 * and allows at most 10 requests/second: https://www.sec.gov/os/accessing-edgar-data
 */
import { config } from "../config.js";
import { cached } from "../lib/cache.js";
import { ApiError } from "../lib/errors.js";
import { CIK_RE, TICKER_RE, fetchUpstream } from "../lib/http.js";
import { createUpstreamLimiter } from "../lib/limiter.js";

const limiter = createUpstreamLimiter("SEC EDGAR", 8, 1000);
const HOUR = 3_600_000;

/** us-gaap / dei concepts kept from the multi-MB companyfacts payload. */
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

function headers(): Record<string, string> {
  if (!config.secUserAgent) {
    throw new ApiError(
      "missing_key",
      'SEC EDGAR needs a contact User-Agent. Set the SEC_USER_AGENT env var on the API server, e.g. "InvesTech.AI you@yourdomain.com".',
      "sec",
    );
  }
  return { "User-Agent": config.secUserAgent, Accept: "application/json" };
}

async function secFetch(url: string) {
  const h = headers();
  await limiter.acquire().catch(() => {
    throw new ApiError("rate_limited", "SEC EDGAR request budget is busy. Try again shortly.", "sec");
  });
  return fetchUpstream("SEC EDGAR", url, { headers: h }, 25_000);
}

const tickerMap = () =>
  cached("sec:tickers", 12 * HOUR, async () => {
    const res = await secFetch("https://www.sec.gov/files/company_tickers.json");
    const json = (await res.json()) as Record<string, { cik_str: number; ticker: string; title: string }>;
    const map: Record<string, { cik: string; ticker: string; title: string }> = {};
    for (const row of Object.values(json)) {
      map[row.ticker.toUpperCase()] = { cik: String(row.cik_str).padStart(10, "0"), ticker: row.ticker.toUpperCase(), title: row.title };
    }
    return map;
  });

export async function lookup(params: Record<string, string>) {
  const ticker = (params.ticker || "").toUpperCase().replace(/\./g, "-");
  if (!TICKER_RE.test(ticker)) throw new ApiError("bad_request", "Invalid ticker.", "sec");
  const map = await tickerMap();
  const hit = map[ticker] || map[ticker.replace(/-/g, "")];
  if (!hit) throw new ApiError("not_found", `Ticker ${ticker} was not found in SEC EDGAR (US-listed SEC filers only).`, "sec");
  return hit;
}

function cikParam(params: Record<string, string>) {
  const cik = params.cik || "";
  if (!CIK_RE.test(cik)) throw new ApiError("bad_request", "Invalid CIK.", "sec");
  return cik;
}

export function companyFacts(params: Record<string, string>) {
  const cik = cikParam(params);
  return cached(`sec:facts:${cik}`, 6 * HOUR, async () => {
    const res = await secFetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`);
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
        for (const [unit, rows] of Object.entries(units)) {
          out[concept][unit] = rows.map((r) => ({ start: r.start, end: r.end, val: r.val, fy: r.fy, fp: r.fp, form: r.form, filed: r.filed }));
        }
      }
    }
    return { cik, entityName: json?.entityName ?? null, facts: out };
  });
}

export function submissions(params: Record<string, string>) {
  const cik = cikParam(params);
  return cached(`sec:subs:${cik}`, 6 * HOUR, async () => {
    const res = await secFetch(`https://data.sec.gov/submissions/CIK${cik}.json`);
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

export const secRoutes: Record<string, (p: Record<string, string>) => Promise<unknown>> = {
  lookup,
  companyfacts: companyFacts,
  submissions,
};
