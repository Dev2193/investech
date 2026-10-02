import { researchRequest } from "./transport";
import type { AnnualFinancials } from "./types";

/** SEC EDGAR (keyless; the backend adds the required contact User-Agent). */

export interface SecCompany {
  cik: string;
  ticker: string;
  title: string;
}

export interface SecSubmissions {
  cik: string;
  name: string | null;
  sic: string | null;
  sicDescription: string | null;
  tickers: string[];
  exchanges: string[];
  fiscalYearEnd: string | null;
  website: string | null;
}

interface SecFact {
  start?: string;
  end: string;
  val: number;
  fy?: number;
  fp?: string;
  form?: string;
  filed?: string;
}

export interface SecCompanyFacts {
  cik: string;
  entityName: string | null;
  facts: Record<string, Record<string, SecFact[]>>;
}

export const lookupTicker = (ticker: string) => researchRequest<SecCompany>("sec", "lookup", { ticker });
export const getSubmissions = (cik: string) => researchRequest<SecSubmissions>("sec", "submissions", { cik });
export const getCompanyFacts = (cik: string) => researchRequest<SecCompanyFacts>("sec", "companyfacts", { cik });

const DAY = 86_400_000;
const isAnnualForm = (f?: string) => !!f && /^(10-K|20-F|40-F)/.test(f);

/**
 * Annual values for one concept, keyed by fiscal-period end date.
 * Duration facts must span roughly a year; instant facts (balance sheet) have no start.
 * If several filings report the same period, the most recently filed value wins
 * (captures restatements).
 */
function annualValues(facts: SecCompanyFacts["facts"], concept: string, unit: string, kind: "duration" | "instant") {
  const rows = facts[concept]?.[unit] ?? [];
  const byEnd = new Map<string, SecFact>();
  for (const r of rows) {
    if (!isAnnualForm(r.form)) continue;
    if (kind === "duration") {
      if (!r.start) continue;
      const days = (Date.parse(r.end) - Date.parse(r.start)) / DAY;
      if (days < 340 || days > 380) continue;
    } else if (r.start) {
      continue;
    }
    const prev = byEnd.get(r.end);
    if (!prev || (r.filed ?? "") > (prev.filed ?? "")) byEnd.set(r.end, r);
  }
  return byEnd;
}

/** First concept (in priority order) that reports a value for each period end. */
function merged(facts: SecCompanyFacts["facts"], concepts: string[], unit: string, kind: "duration" | "instant") {
  const out = new Map<string, number>();
  for (const c of concepts) {
    for (const [end, f] of annualValues(facts, c, unit, kind)) {
      if (!out.has(end)) out.set(end, f.val);
    }
  }
  return out;
}

const REVENUE = [
  "Revenues",
  "RevenueFromContractWithCustomerExcludingAssessedTax",
  "RevenueFromContractWithCustomerIncludingAssessedTax",
  "SalesRevenueNet",
  "RevenuesNetOfInterestExpense",
];

/** Turn trimmed companyfacts into up to `years` fiscal years of annual figures (oldest first). */
export function buildAnnualFinancials(cf: SecCompanyFacts, years = 6): AnnualFinancials[] {
  const f = cf.facts;
  const revenue = merged(f, REVENUE, "USD", "duration");
  const netIncome = merged(f, ["NetIncomeLoss"], "USD", "duration");
  const gross = merged(f, ["GrossProfit"], "USD", "duration");
  const opInc = merged(f, ["OperatingIncomeLoss"], "USD", "duration");
  const eps = merged(f, ["EarningsPerShareDiluted", "EarningsPerShareBasic"], "USD/shares", "duration");
  const ocf = merged(f, ["NetCashProvidedByUsedInOperatingActivities"], "USD", "duration");
  const capex = merged(f, ["PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets"], "USD", "duration");
  const cash = merged(
    f,
    ["CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents"],
    "USD",
    "instant",
  );
  const ltDebt = merged(f, ["LongTermDebtNoncurrent", "LongTermDebt"], "USD", "instant");
  const curDebt = merged(f, ["LongTermDebtCurrent", "DebtCurrent"], "USD", "instant");
  const shortBorrow = merged(f, ["ShortTermBorrowings", "CommercialPaper"], "USD", "instant");
  const equity = merged(f, ["StockholdersEquity"], "USD", "instant");
  const assets = merged(f, ["Assets"], "USD", "instant");
  const liabilities = merged(f, ["Liabilities"], "USD", "instant");
  const curAssets = merged(f, ["AssetsCurrent"], "USD", "instant");
  const curLiab = merged(f, ["LiabilitiesCurrent"], "USD", "instant");

  // Anchor fiscal years on income-statement period ends (revenue, else net income).
  const anchor = revenue.size ? revenue : netIncome;
  const ends = [...anchor.keys()].sort().slice(-years);

  return ends.map((end) => {
    const get = (m: Map<string, number>) => (m.has(end) ? (m.get(end) as number) : null);
    const lt = get(ltDebt);
    const cd = get(curDebt);
    const sb = get(shortBorrow);
    const debtParts = [lt, cd, sb].filter((v): v is number => v !== null);
    const o = get(ocf);
    const c = get(capex);
    return {
      fiscalYear: new Date(end).getUTCFullYear(),
      periodEnd: end,
      revenue: get(revenue),
      grossProfit: get(gross),
      operatingIncome: get(opInc),
      netIncome: get(netIncome),
      epsDiluted: get(eps),
      cash: get(cash),
      totalDebt: debtParts.length ? debtParts.reduce((a, b) => a + b, 0) : null,
      equity: get(equity),
      assets: get(assets),
      liabilities: get(liabilities),
      currentAssets: get(curAssets),
      currentLiabilities: get(curLiab),
      operatingCashFlow: o,
      capex: c,
      freeCashFlow: o !== null && c !== null ? o - c : null,
    };
  });
}

/** Latest reported shares outstanding (dei cover-page fact), for a market-cap estimate. */
export function latestSharesOutstanding(cf: SecCompanyFacts): number | null {
  const rows = cf.facts.EntityCommonStockSharesOutstanding?.shares ?? [];
  if (!rows.length) return null;
  const latestEnd = rows.reduce((m, r) => (r.end > m ? r.end : m), "");
  // Ignore stale cover-page data (some filers stopped tagging it years ago).
  if (Date.now() - Date.parse(latestEnd) > 540 * DAY) return null;
  const values = new Set(rows.filter((r) => r.end === latestEnd).map((r) => r.val));
  // Several distinct values on the same date = multiple share classes (e.g. BRK-A/BRK-B).
  // Price x shares would be misleading there, so return null and let the UI say so.
  if (values.size !== 1) return null;
  return [...values][0];
}
