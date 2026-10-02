/**
 * Transparent scoring for each report section and the final verdict.
 * Every point added or subtracted is recorded as a ScoreFactor so the UI can show
 * exactly why the verdict came out the way it did. Thresholds are deliberately
 * simple rules of thumb, not a predictive model.
 */
import type { AnnualFinancials, ScoreFactor, SectionScore, SeriesPoint, PricePoint } from "./types";
import { simpleMovingAverage, trailingReturn } from "./prices";
import { latest, valueMonthsAgo, yoyChange } from "./fred";
import type { MacroIndicator, SectorInfo } from "./sectors";
import type { FinnhubRecommendation } from "./finnhub";

const clamp = (n: number, lo = -2, hi = 2) => Math.max(lo, Math.min(hi, n));
const pct = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`;
const ratio = (a: number | null, b: number | null) => (a !== null && b !== null && b !== 0 ? a / b : null);
export const growth = (cur: number | null, prev: number | null) =>
  cur !== null && prev !== null && prev !== 0 ? (cur - prev) / Math.abs(prev) : null;

function finish(factors: ScoreFactor[], summaryWhenEmpty: string): SectionScore {
  if (!factors.length) return { score: null, factors, summary: summaryWhenEmpty };
  const score = clamp(factors.reduce((s, f) => s + f.points, 0));
  const summary =
    score >= 1 ? "Clearly positive" : score > 0.25 ? "Mildly positive" : score <= -1 ? "Clearly negative" : score < -0.25 ? "Mildly negative" : "Neutral / mixed";
  return { score, factors, summary };
}

// ------------------------------------------------------------------ financials
export interface KeyRatios {
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;
  revenueGrowth: number | null;
  netIncomeGrowth: number | null;
  epsGrowth: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  returnOnEquity: number | null;
  netCash: number | null;
  fcfMargin: number | null;
  peRatio: number | null;
  marketCap: number | null;
}

export function computeRatios(years: AnnualFinancials[], price: number | null, shares: number | null): KeyRatios {
  const cur = years[years.length - 1];
  const prev = years[years.length - 2];
  const empty: KeyRatios = {
    grossMargin: null, operatingMargin: null, netMargin: null, revenueGrowth: null, netIncomeGrowth: null,
    epsGrowth: null, debtToEquity: null, currentRatio: null, returnOnEquity: null, netCash: null, fcfMargin: null,
    peRatio: null, marketCap: null,
  };
  if (!cur) return empty;
  return {
    grossMargin: ratio(cur.grossProfit, cur.revenue),
    operatingMargin: ratio(cur.operatingIncome, cur.revenue),
    netMargin: ratio(cur.netIncome, cur.revenue),
    revenueGrowth: prev ? growth(cur.revenue, prev.revenue) : null,
    netIncomeGrowth: prev ? growth(cur.netIncome, prev.netIncome) : null,
    epsGrowth: prev ? growth(cur.epsDiluted, prev.epsDiluted) : null,
    debtToEquity: cur.equity !== null && cur.equity > 0 ? ratio(cur.totalDebt ?? 0, cur.equity) : null,
    currentRatio: ratio(cur.currentAssets, cur.currentLiabilities),
    returnOnEquity: cur.equity !== null && cur.equity > 0 ? ratio(cur.netIncome, cur.equity) : null,
    netCash: cur.cash !== null ? cur.cash - (cur.totalDebt ?? 0) : null,
    fcfMargin: ratio(cur.freeCashFlow, cur.revenue),
    peRatio: price !== null && cur.epsDiluted !== null && cur.epsDiluted > 0 ? price / cur.epsDiluted : null,
    marketCap: price !== null && shares !== null ? price * shares : null,
  };
}

export function scoreFinancials(r: KeyRatios): SectionScore {
  const f: ScoreFactor[] = [];
  if (r.revenueGrowth !== null) {
    const g = r.revenueGrowth;
    f.push({
      label: "Revenue growth (YoY)",
      points: g > 0.1 ? 0.75 : g > 0.03 ? 0.25 : g < 0 ? -0.75 : 0,
      detail: `${pct(g)} (>10% strong, <0% shrinking)`,
    });
  }
  if (r.netMargin !== null) {
    const m = r.netMargin;
    f.push({
      label: "Net profit margin",
      points: m > 0.15 ? 0.5 : m > 0.05 ? 0.25 : m < 0 ? -0.75 : 0,
      detail: `${pct(m)} (>15% high, <0% loss-making)`,
    });
  }
  if (r.epsGrowth !== null) {
    f.push({
      label: "EPS growth (YoY)",
      points: r.epsGrowth > 0.05 ? 0.25 : r.epsGrowth < -0.05 ? -0.25 : 0,
      detail: pct(r.epsGrowth),
    });
  }
  if (r.debtToEquity !== null) {
    const d = r.debtToEquity;
    f.push({
      label: "Debt / equity",
      points: d < 0.5 ? 0.25 : d > 2 ? -0.5 : 0,
      detail: `${d.toFixed(2)}x (<0.5x conservative, >2x heavily levered)`,
    });
  }
  if (r.fcfMargin !== null) {
    f.push({
      label: "Free cash flow",
      points: r.fcfMargin > 0.05 ? 0.25 : r.fcfMargin < 0 ? -0.5 : 0,
      detail: `${pct(r.fcfMargin)} of revenue`,
    });
  }
  if (r.peRatio !== null) {
    f.push({
      label: "Valuation (P/E on last FY EPS)",
      points: r.peRatio > 40 ? -0.25 : r.peRatio < 15 ? 0.25 : 0,
      detail: `${r.peRatio.toFixed(1)}x (<15x inexpensive, >40x priced for high growth)`,
    });
  }
  return finish(f, "No SEC financial data available.");
}

// ------------------------------------------------------------------ industry outlook
export interface IndustryInputs {
  sector: SectorInfo | null;
  sectorPrices: PricePoint[] | null;
  marketPrices: PricePoint[] | null;
  peerMedianRevenueGrowth: number | null;
}

export function industryMetrics(i: IndustryInputs) {
  const sp = i.sectorPrices ?? [];
  const mp = i.marketPrices ?? [];
  const sma200 = simpleMovingAverage(sp, 200);
  const last = sp.length ? sp[sp.length - 1].close : null;
  return {
    sector3m: trailingReturn(sp, 91),
    sector6m: trailingReturn(sp, 182),
    sector12m: trailingReturn(sp, 365),
    market3m: trailingReturn(mp, 91),
    market6m: trailingReturn(mp, 182),
    market12m: trailingReturn(mp, 365),
    aboveSma200: sma200 !== null && last !== null ? last > sma200 : null,
    sma200,
    last,
  };
}

export function scoreIndustry(i: IndustryInputs): SectionScore {
  const m = industryMetrics(i);
  const f: ScoreFactor[] = [];
  const etf = i.sector?.etf ?? "sector ETF";
  if (m.sector12m !== null && m.market12m !== null) {
    const rel = m.sector12m - m.market12m;
    f.push({
      label: `${etf} vs S&P 500, 12 months`,
      points: rel > 0.05 ? 0.75 : rel < -0.05 ? -0.75 : 0,
      detail: `${pct(m.sector12m)} vs ${pct(m.market12m)} (${rel >= 0 ? "+" : ""}${pct(rel)} relative)`,
    });
  }
  if (m.sector3m !== null && m.market3m !== null) {
    const rel = m.sector3m - m.market3m;
    f.push({
      label: `${etf} vs S&P 500, 3 months (recent momentum)`,
      points: rel > 0.02 ? 0.5 : rel < -0.02 ? -0.5 : 0,
      detail: `${pct(m.sector3m)} vs ${pct(m.market3m)}`,
    });
  }
  if (m.aboveSma200 !== null) {
    f.push({
      label: `${etf} trend (vs 200-day average)`,
      points: m.aboveSma200 ? 0.25 : -0.25,
      detail: m.aboveSma200 ? "Trading above its 200-day average (uptrend)" : "Trading below its 200-day average (downtrend)",
    });
  }
  if (i.peerMedianRevenueGrowth !== null) {
    const g = i.peerMedianRevenueGrowth;
    f.push({
      label: "Peer group median revenue growth",
      points: g > 0.08 ? 0.5 : g < 0 ? -0.5 : 0,
      detail: `${pct(g)} latest fiscal year (industry demand proxy)`,
    });
  }
  return finish(f, "No sector performance data available.");
}

// ------------------------------------------------------------------ competitive position
export interface PeerRow {
  ticker: string;
  name: string;
  isSubject: boolean;
  revenueByYear: Record<number, number>;
  latestRevenue: number | null;
  revenueGrowth: number | null;
  netMargin: number | null;
  marketCap: number | null; // USD
}

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

/** Subject's share of combined peer-group revenue for each year where all peers reported. */
export function revenueShareByYear(rows: PeerRow[]) {
  const years = new Set<number>();
  rows.forEach((r) => Object.keys(r.revenueByYear).forEach((y) => years.add(Number(y))));
  const out: { year: number; share: number }[] = [];
  for (const y of [...years].sort()) {
    const withData = rows.filter((r) => r.revenueByYear[y] !== undefined);
    const subj = rows.find((r) => r.isSubject);
    if (!subj || subj.revenueByYear[y] === undefined || withData.length < Math.min(3, rows.length)) continue;
    const total = withData.reduce((s, r) => s + r.revenueByYear[y], 0);
    if (total > 0) out.push({ year: y, share: subj.revenueByYear[y] / total });
  }
  return out;
}

export function positionMetrics(rows: PeerRow[]) {
  const subj = rows.find((r) => r.isSubject) ?? null;
  const peers = rows.filter((r) => !r.isSubject);
  const peerGrowth = median(peers.map((p) => p.revenueGrowth).filter((x): x is number => x !== null));
  const peerMargin = median(peers.map((p) => p.netMargin).filter((x): x is number => x !== null));
  const byCap = rows.filter((r) => r.marketCap !== null).sort((a, b) => (b.marketCap as number) - (a.marketCap as number));
  const byRev = rows.filter((r) => r.latestRevenue !== null).sort((a, b) => (b.latestRevenue as number) - (a.latestRevenue as number));
  const capRank = subj && subj.marketCap !== null ? byCap.findIndex((r) => r.isSubject) + 1 : null;
  const revRank = subj && subj.latestRevenue !== null ? byRev.findIndex((r) => r.isSubject) + 1 : null;
  const shares = revenueShareByYear(rows);
  return { subj, peerGrowth, peerMargin, capRank, capCount: byCap.length, revRank, revCount: byRev.length, shares };
}

export function scorePosition(rows: PeerRow[], stockVsSector12m: number | null): SectionScore {
  const f: ScoreFactor[] = [];
  const m = positionMetrics(rows);
  if (m.subj?.revenueGrowth != null && m.peerGrowth !== null) {
    const d = m.subj.revenueGrowth - m.peerGrowth;
    f.push({
      label: "Revenue growth vs peer median",
      points: d > 0.03 ? 0.75 : d < -0.03 ? -0.75 : 0,
      detail: `${pct(m.subj.revenueGrowth)} vs ${pct(m.peerGrowth)} (gaining share if faster)`,
    });
  }
  if (m.shares.length >= 2) {
    const first = m.shares[0];
    const lastS = m.shares[m.shares.length - 1];
    const d = lastS.share - first.share;
    f.push({
      label: `Share of peer-group revenue ${first.year}→${lastS.year}`,
      points: d > 0.02 ? 0.5 : d < -0.02 ? -0.5 : 0,
      detail: `${pct(first.share)} → ${pct(lastS.share)} (market-share proxy)`,
    });
  }
  if (m.subj?.netMargin != null && m.peerMargin !== null) {
    const d = m.subj.netMargin - m.peerMargin;
    f.push({
      label: "Net margin vs peer median",
      points: d > 0.03 ? 0.5 : d < -0.03 ? -0.5 : 0,
      detail: `${pct(m.subj.netMargin)} vs ${pct(m.peerMargin)} (pricing power / efficiency)`,
    });
  }
  if (stockVsSector12m !== null) {
    f.push({
      label: "Stock vs its sector ETF, 12 months",
      points: stockVsSector12m > 0.1 ? 0.25 : stockVsSector12m < -0.1 ? -0.25 : 0,
      detail: `${stockVsSector12m >= 0 ? "+" : ""}${pct(stockVsSector12m)} relative return`,
    });
  }
  return finish(f, "No peer comparison data available.");
}

// ------------------------------------------------------------------ sentiment
export function recommendationScore(r: FinnhubRecommendation) {
  const total = r.strongBuy + r.buy + r.hold + r.sell + r.strongSell;
  if (!total) return null;
  // -2 (all strong sell) .. +2 (all strong buy)
  return (2 * r.strongBuy + r.buy - r.sell - 2 * r.strongSell) / total;
}

export function scoreSentiment(
  recs: FinnhubRecommendation[] | null,
  news: { count: number; average: number } | null,
  stock3m: number | null,
): SectionScore {
  const f: ScoreFactor[] = [];
  const sorted = recs ? [...recs].sort((a, b) => (a.period < b.period ? 1 : -1)) : [];
  const cur = sorted[0];
  const curScore = cur ? recommendationScore(cur) : null;
  if (cur && curScore !== null) {
    const total = cur.strongBuy + cur.buy + cur.hold + cur.sell + cur.strongSell;
    const bullish = (cur.strongBuy + cur.buy) / total;
    f.push({
      label: "Analyst consensus",
      points: curScore > 1 ? 0.75 : curScore > 0.4 ? 0.25 : curScore < 0 ? -0.75 : 0,
      detail: `${pct(bullish, 0)} buy-rated of ${total} analysts (consensus ${curScore.toFixed(2)} on a −2…+2 scale)`,
    });
    const old = sorted[3] ?? sorted[sorted.length - 1];
    const oldScore = old && old !== cur ? recommendationScore(old) : null;
    if (oldScore !== null) {
      const d = curScore - oldScore;
      f.push({
        label: `Analyst trend since ${old.period.slice(0, 7)}`,
        points: d > 0.1 ? 0.25 : d < -0.1 ? -0.25 : 0,
        detail: `${d >= 0 ? "+" : ""}${d.toFixed(2)} change in consensus score`,
      });
    }
  }
  if (news && news.count >= 3) {
    f.push({
      label: "News headline tone (30 days)",
      points: news.average > 0.1 ? 0.5 : news.average < -0.1 ? -0.5 : 0,
      detail: `Average ${news.average.toFixed(2)} across ${news.count} headlines (−1…+1)`,
    });
  }
  if (stock3m !== null) {
    f.push({
      label: "Price momentum (3 months)",
      points: stock3m > 0.08 ? 0.25 : stock3m < -0.08 ? -0.25 : 0,
      detail: `${stock3m >= 0 ? "+" : ""}${pct(stock3m)}`,
    });
  }
  return finish(f, "No sentiment data available.");
}

// ------------------------------------------------------------------ economy
export interface IndicatorReading {
  indicator: MacroIndicator;
  current: number | null;
  yearAgo: number | null;
  change: number | null; // in the indicator's displayed unit (pp for %, absolute otherwise)
  asOf: string | null;
  history: SeriesPoint[];
}

/** Compute the displayed value (level or YoY %) and its 12-month change. */
export function readIndicator(indicator: MacroIndicator, obs: SeriesPoint[]): IndicatorReading {
  let history: SeriesPoint[];
  if (indicator.transform === "yoy") {
    history = obs
      .map((o, idx) => {
        const yearAgo = valueMonthsAgo(obs.slice(0, idx + 1), 12);
        return yearAgo && yearAgo.value !== 0 && yearAgo.date !== o.date
          ? { date: o.date, value: (o.value / yearAgo.value - 1) * 100 }
          : null;
      })
      .filter((x): x is SeriesPoint => x !== null);
  } else {
    history = obs;
  }
  const cur = latest(history);
  const prev = valueMonthsAgo(history, 12);
  return {
    indicator,
    current: cur?.value ?? null,
    yearAgo: prev?.value ?? null,
    change: cur && prev ? cur.value - prev.value : null,
    asOf: cur?.date ?? null,
    history,
  };
}

export function scoreEconomy(readings: IndicatorReading[], sector: SectorInfo | null): SectionScore {
  const f: ScoreFactor[] = [];
  const byId = (id: string) => readings.find((r) => r.indicator.id === id && r.current !== null);
  const rateSens = sector?.rateSensitivity ?? 0.5;

  const ff = byId("FEDFUNDS");
  if (ff && ff.change !== null && Math.abs(ff.change) >= 0.25) {
    const pts = (ff.change < 0 ? 1 : -1) * 0.5 * Math.max(0.5, rateSens);
    f.push({
      label: "Interest-rate direction",
      points: Number(pts.toFixed(2)),
      detail: `Fed funds ${ff.change < 0 ? "down" : "up"} ${Math.abs(ff.change).toFixed(2)} pp over 12 months; sector rate sensitivity ${rateSens}`,
    });
  } else if (ff) {
    f.push({ label: "Interest-rate direction", points: 0, detail: "Fed funds roughly unchanged over 12 months" });
  }
  const cpi = byId("CPIAUCSL");
  if (cpi && cpi.current !== null) {
    f.push({
      label: "Inflation",
      points: cpi.current > 3.5 ? -0.5 : cpi.current <= 2.5 ? 0.25 : 0,
      detail: `CPI ${cpi.current.toFixed(1)}% YoY (Fed target ≈2%)`,
    });
  }
  const gdp = byId("A191RL1Q225SBEA");
  if (gdp && gdp.current !== null) {
    f.push({
      label: "Economic growth",
      points: gdp.current >= 2 ? 0.5 : gdp.current < 0 ? -1 : 0,
      detail: `Real GDP ${gdp.current.toFixed(1)}% annualized (latest quarter)`,
    });
  }
  const un = byId("UNRATE");
  if (un && un.change !== null) {
    f.push({
      label: "Labor market",
      points: un.change >= 0.5 ? -0.5 : un.change <= -0.2 ? 0.25 : 0,
      detail: `Unemployment ${un.current?.toFixed(1)}% (${un.change >= 0 ? "+" : ""}${un.change.toFixed(1)} pp over 12 months)`,
    });
  }
  const tenY = byId("GS10");
  if (tenY && tenY.change !== null) {
    const pts = tenY.change >= 0.5 ? -0.25 * Math.max(0.5, rateSens) * 2 : tenY.change <= -0.5 ? 0.25 * Math.max(0.5, rateSens) * 2 : 0;
    f.push({
      label: "Long-term yields",
      points: Number(pts.toFixed(2)),
      detail: `10-year Treasury ${tenY.current?.toFixed(2)}% (${tenY.change >= 0 ? "+" : ""}${tenY.change.toFixed(2)} pp over 12 months)`,
    });
  }
  for (const ind of sector?.indicators ?? []) {
    if (ind.id === "GS10") continue;
    if (ind.goodWhenRising === 0) continue;
    const r = byId(ind.id);
    if (!r || r.change === null || r.current === null) continue;
    const threshold = ind.transform === "yoy" ? 2 : ind.unit === "$" ? Math.abs(r.yearAgo ?? 0) * 0.1 : 0.25;
    const dir = r.change > threshold ? 1 : r.change < -threshold ? -1 : 0;
    f.push({
      label: `Sector indicator: ${ind.label}`,
      points: 0.5 * dir * ind.goodWhenRising,
      detail: `${r.change >= 0 ? "+" : ""}${r.change.toFixed(2)}${ind.unit === "$" ? " $" : ind.unit === "%" ? " pp" : ""} over 12 months`,
    });
  }
  return finish(f, "No macroeconomic data available.");
}

// ------------------------------------------------------------------ verdict
export const SECTION_WEIGHTS = {
  financials: 0.3,
  position: 0.2,
  economy: 0.15,
  industry: 0.15,
  sentiment: 0.2,
} as const;

export type SectionKey = keyof typeof SECTION_WEIGHTS;

export const SECTION_LABELS: Record<SectionKey, string> = {
  financials: "Company financials",
  industry: "Industry outlook",
  position: "Industry position",
  sentiment: "Market sentiment",
  economy: "Economic factors",
};

export interface Verdict {
  label: "Invest" | "Hold" | "Avoid" | "Insufficient data";
  composite: number | null;
  coverage: number;
  rows: { key: SectionKey; weight: number; score: number | null; contribution: number | null }[];
}

/**
 * Weighted average of available section scores (each −2…+2), re-normalized over the
 * sections that had data. ≥ +0.5 → Invest, ≤ −0.5 → Avoid, otherwise Hold.
 * At least 50% of the total weight must be covered to give a verdict.
 */
export function computeVerdict(scores: Partial<Record<SectionKey, SectionScore | undefined>>): Verdict {
  const rows = (Object.keys(SECTION_WEIGHTS) as SectionKey[]).map((key) => {
    const s = scores[key]?.score ?? null;
    return { key, weight: SECTION_WEIGHTS[key], score: s, contribution: s === null ? null : s * SECTION_WEIGHTS[key] };
  });
  const covered = rows.filter((r) => r.score !== null);
  const coverage = covered.reduce((s, r) => s + r.weight, 0);
  if (coverage < 0.5) return { label: "Insufficient data", composite: null, coverage, rows };
  const composite = covered.reduce((s, r) => s + (r.contribution as number), 0) / coverage;
  const label = composite >= 0.5 ? "Invest" : composite <= -0.5 ? "Avoid" : "Hold";
  return { label, composite, coverage, rows };
}
