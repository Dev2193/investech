import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { ResearchError } from "@/services/research/transport";
import { buildAnnualFinancials, getCompanyFacts, getSubmissions, latestSharesOutstanding, lookupTicker } from "@/services/research/secEdgar";
import { getPriceHistory, trailingReturn } from "@/services/research/prices";
import { getFredSeries } from "@/services/research/fred";
import { getCompanyNews, getMetrics, getPeers, getProfile, getRecommendations } from "@/services/research/finnhub";
import { GENERAL_INDICATORS, sectorFromIndustryLabel, sectorFromSic, type MacroIndicator } from "@/services/research/sectors";
import { aggregateHeadlines } from "@/services/research/newsSentiment";
import {
  computeRatios,
  computeVerdict,
  growth,
  readIndicator,
  scoreEconomy,
  scoreFinancials,
  scoreIndustry,
  scorePosition,
  scoreSentiment,
  type IndicatorReading,
  type PeerRow,
} from "@/services/research/analysis";

const MAX_PEERS = 5;
const HOUR = 3_600_000;

/** Don't retry errors that won't fix themselves (missing key, unknown ticker, bad input). */
const retry = (count: number, err: unknown) => {
  if (err instanceof ResearchError) {
    if (err.code === "rate_limited") return count < 1;
    if (err.code === "missing_key" || err.code === "not_found" || err.code === "bad_request") return false;
  }
  return count < 1;
};
const retryDelay = (attempt: number, err: unknown) =>
  err instanceof ResearchError && err.code === "rate_limited" ? 20_000 : 1500 * (attempt + 1);
const common = { retry, retryDelay, staleTime: HOUR, refetchOnWindowFocus: false } as const;

const fiveYearsAgo = () => {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - 5);
  return d.toISOString().slice(0, 10);
};

export function useStockResearch(rawTicker: string) {
  const ticker = rawTicker.trim().toUpperCase();

  // ---- identity + fundamentals (SEC EDGAR, keyless)
  const company = useQuery({ queryKey: ["sec-lookup", ticker], queryFn: () => lookupTicker(ticker), enabled: !!ticker, ...common });
  const cik = company.data?.cik;
  const submissions = useQuery({ queryKey: ["sec-subs", cik], queryFn: () => getSubmissions(cik as string), enabled: !!cik, ...common });
  const facts = useQuery({ queryKey: ["sec-facts", cik], queryFn: () => getCompanyFacts(cik as string), enabled: !!cik, ...common });

  // ---- prices (Yahoo chart, keyless)
  const price = useQuery({ queryKey: ["price", ticker, "2y"], queryFn: () => getPriceHistory(ticker, "2y", "1d"), enabled: !!ticker, ...common, staleTime: 15 * 60_000 });

  // ---- Finnhub (optional key)
  const profile = useQuery({ queryKey: ["fh-profile", ticker], queryFn: () => getProfile(ticker), enabled: !!ticker, ...common });
  const peersQ = useQuery({ queryKey: ["fh-peers", ticker], queryFn: () => getPeers(ticker), enabled: !!ticker, ...common });
  const recs = useQuery({ queryKey: ["fh-recs", ticker], queryFn: () => getRecommendations(ticker), enabled: !!ticker, ...common });
  const news = useQuery({ queryKey: ["fh-news", ticker], queryFn: () => getCompanyNews(ticker, 30), enabled: !!ticker, ...common });
  const metrics = useQuery({ queryKey: ["fh-metrics", ticker], queryFn: () => getMetrics(ticker), enabled: !!ticker, ...common });

  const sector = useMemo(
    () => sectorFromSic(submissions.data?.sic) ?? sectorFromIndustryLabel(profile.data?.finnhubIndustry),
    [submissions.data?.sic, profile.data?.finnhubIndustry],
  );

  const sectorPrice = useQuery({
    queryKey: ["price", sector?.etf, "2y"],
    queryFn: () => getPriceHistory(sector!.etf, "2y", "1d"),
    enabled: !!sector,
    ...common,
    staleTime: 15 * 60_000,
  });
  const marketPrice = useQuery({ queryKey: ["price", "SPY", "2y"], queryFn: () => getPriceHistory("SPY", "2y", "1d"), ...common, staleTime: 15 * 60_000 });

  // ---- peers: SEC revenue history (keyless) + Finnhub market cap (optional)
  const peerTickers = useMemo(
    () => (peersQ.data ?? []).map((p) => p.toUpperCase()).filter((p) => p !== ticker && !p.includes(".")).slice(0, MAX_PEERS),
    [peersQ.data, ticker],
  );
  const peerQueries = useQueries({
    queries: peerTickers.map((p) => ({
      queryKey: ["peer", p],
      queryFn: async () => {
        const c = await lookupTicker(p);
        const [cf, prof] = await Promise.all([getCompanyFacts(c.cik), getProfile(p).catch(() => null)]);
        return { ticker: p, name: prof?.name || c.title, years: buildAnnualFinancials(cf, 6), marketCapM: prof?.marketCapitalization ?? null };
      },
      ...common,
    })),
  });

  // ---- macro (FRED)
  const indicators: MacroIndicator[] = useMemo(() => {
    const list = [...GENERAL_INDICATORS];
    for (const i of sector?.indicators ?? []) if (!list.some((x) => x.id === i.id)) list.push(i);
    return list;
  }, [sector]);
  const start = useMemo(fiveYearsAgo, []);
  const fredQueries = useQueries({
    queries: indicators.map((ind) => ({
      queryKey: ["fred", ind.id, start],
      queryFn: () => getFredSeries(ind.id, start),
      ...common,
      staleTime: 6 * HOUR,
    })),
  });

  // ---------------------------------------------------------------- derived
  const annual = useMemo(() => (facts.data ? buildAnnualFinancials(facts.data) : []), [facts.data]);
  const shares = useMemo(() => (facts.data ? latestSharesOutstanding(facts.data) : null), [facts.data]);
  const ratios = useMemo(() => computeRatios(annual, price.data?.price ?? null, shares), [annual, price.data?.price, shares]);
  const marketCap = profile.data?.marketCapitalization ? profile.data.marketCapitalization * 1e6 : ratios.marketCap;
  const financialScore = useMemo(() => (annual.length ? scoreFinancials(ratios) : undefined), [annual.length, ratios]);

  const peerRows: PeerRow[] = useMemo(() => {
    const toRow = (t: string, name: string, years: typeof annual, cap: number | null, isSubject: boolean): PeerRow => {
      const last = years[years.length - 1];
      const prev = years[years.length - 2];
      const revenueByYear: Record<number, number> = {};
      years.forEach((y) => {
        if (y.revenue !== null) revenueByYear[y.fiscalYear] = y.revenue;
      });
      return {
        ticker: t,
        name,
        isSubject,
        revenueByYear,
        latestRevenue: last?.revenue ?? null,
        revenueGrowth: last && prev ? growth(last.revenue, prev.revenue) : null,
        netMargin: last && last.revenue ? (last.netIncome ?? NaN) / last.revenue : null,
        marketCap: cap,
      };
    };
    const rows: PeerRow[] = [];
    if (annual.length) rows.push(toRow(ticker, company.data?.title ?? ticker, annual, marketCap ?? null, true));
    for (const q of peerQueries) {
      if (q.data && q.data.years.length) {
        rows.push(toRow(q.data.ticker, q.data.name, q.data.years, q.data.marketCapM ? q.data.marketCapM * 1e6 : null, false));
      }
    }
    return rows.map((r) => ({ ...r, netMargin: r.netMargin !== null && Number.isFinite(r.netMargin) ? r.netMargin : null }));
  }, [annual, peerQueries, ticker, company.data?.title, marketCap]);

  const peersLoading = peersQ.isLoading || peerQueries.some((q) => q.isLoading);
  const peerGrowths = peerRows.filter((r) => !r.isSubject && r.revenueGrowth !== null).map((r) => r.revenueGrowth as number);
  const peerMedianRevenueGrowth = peerGrowths.length ? [...peerGrowths].sort((a, b) => a - b)[Math.floor(peerGrowths.length / 2)] : null;

  const industryInputs = {
    sector,
    sectorPrices: sectorPrice.data?.points ?? null,
    marketPrices: marketPrice.data?.points ?? null,
    peerMedianRevenueGrowth,
  };
  const industryScore = useMemo(
    () => (sectorPrice.data && marketPrice.data ? scoreIndustry(industryInputs) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sector, sectorPrice.data, marketPrice.data, peerMedianRevenueGrowth],
  );

  const stock12m = price.data ? trailingReturn(price.data.points, 365) : null;
  const stock3m = price.data ? trailingReturn(price.data.points, 91) : null;
  const sector12m = sectorPrice.data ? trailingReturn(sectorPrice.data.points, 365) : null;
  const stockVsSector12m = stock12m !== null && sector12m !== null ? stock12m - sector12m : null;
  const positionScore = useMemo(
    () => (peerRows.filter((r) => !r.isSubject).length >= 2 && !peersLoading ? scorePosition(peerRows, stockVsSector12m) : undefined),
    [peerRows, peersLoading, stockVsSector12m],
  );

  const newsAgg = useMemo(() => (news.data ? aggregateHeadlines(news.data.map((n) => n.headline)) : null), [news.data]);
  const sentimentScore = useMemo(
    () => (recs.data || newsAgg ? scoreSentiment(recs.data ?? null, newsAgg, stock3m) : undefined),
    [recs.data, newsAgg, stock3m],
  );

  const fredKey = fredQueries.map((q) => q.dataUpdatedAt).join(",");
  const readings: IndicatorReading[] = useMemo(
    () =>
      indicators
        .map((ind, i) => (fredQueries[i]?.data ? readIndicator(ind, fredQueries[i].data!.observations) : null))
        .filter((r): r is IndicatorReading => r !== null),
    // fredKey changes whenever any FRED query receives new data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [indicators, fredKey],
  );
  const fredLoading = fredQueries.some((q) => q.isLoading);
  const fredErrors = fredQueries.map((q) => q.error).filter(Boolean) as Error[];
  const economyScore = useMemo(() => (readings.length && !fredLoading ? scoreEconomy(readings, sector) : undefined), [readings, fredLoading, sector]);

  const verdict = useMemo(
    () =>
      computeVerdict({
        financials: financialScore,
        industry: industryScore,
        position: positionScore,
        sentiment: sentimentScore,
        economy: economyScore,
      }),
    [financialScore, industryScore, positionScore, sentimentScore, economyScore],
  );

  const stillLoading =
    company.isLoading || facts.isLoading || price.isLoading || sectorPrice.isLoading || marketPrice.isLoading ||
    peersLoading || recs.isLoading || news.isLoading || fredLoading;

  return {
    ticker,
    company,
    submissions,
    facts,
    price,
    profile,
    metrics,
    sector,
    sectorPrice,
    marketPrice,
    peersQ,
    peerQueries,
    peerTickers,
    peerRows,
    peersLoading,
    recs,
    news,
    newsAgg,
    indicators,
    fredQueries,
    readings,
    fredErrors,
    fredLoading,
    annual,
    shares,
    ratios,
    marketCap,
    industryInputs,
    stockVsSector12m,
    scores: {
      financials: financialScore,
      industry: industryScore,
      position: positionScore,
      sentiment: sentimentScore,
      economy: economyScore,
    },
    verdict,
    stillLoading,
  };
}

export type StockResearch = ReturnType<typeof useStockResearch>;
