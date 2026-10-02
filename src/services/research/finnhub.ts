import { researchRequest } from "./transport";

/** Finnhub free tier (https://finnhub.io). Requires FINNHUB_API_KEY on the backend. */

export interface FinnhubProfile {
  name?: string;
  ticker?: string;
  country?: string;
  currency?: string;
  exchange?: string;
  finnhubIndustry?: string;
  ipo?: string;
  logo?: string;
  marketCapitalization?: number; // in millions
  shareOutstanding?: number;
  weburl?: string;
}

export interface FinnhubRecommendation {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

export interface FinnhubNewsItem {
  datetime: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
}

export interface FinnhubMetrics {
  metric?: Record<string, number | string | null>;
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export const getProfile = (symbol: string) => researchRequest<FinnhubProfile>("finnhub", "stock/profile2", { symbol });
export const getPeers = (symbol: string) => researchRequest<string[]>("finnhub", "stock/peers", { symbol });
export const getRecommendations = (symbol: string) =>
  researchRequest<FinnhubRecommendation[]>("finnhub", "stock/recommendation", { symbol });
export const getMetrics = (symbol: string) => researchRequest<FinnhubMetrics>("finnhub", "stock/metric", { symbol });

export function getCompanyNews(symbol: string, days = 30) {
  const to = new Date();
  const from = new Date(Date.now() - days * 86_400_000);
  return researchRequest<FinnhubNewsItem[]>("finnhub", "company-news", { symbol, from: isoDate(from), to: isoDate(to) });
}
