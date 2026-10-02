export interface SeriesPoint {
  date: string;
  value: number;
}

export interface PricePoint {
  date: string;
  close: number;
}

/** One fiscal year of figures derived from SEC 10-K XBRL facts. null = not reported. */
export interface AnnualFinancials {
  fiscalYear: number;
  periodEnd: string;
  revenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  epsDiluted: number | null;
  cash: number | null;
  totalDebt: number | null;
  equity: number | null;
  assets: number | null;
  liabilities: number | null;
  currentAssets: number | null;
  currentLiabilities: number | null;
  operatingCashFlow: number | null;
  capex: number | null;
  freeCashFlow: number | null;
}

/** Score contribution shown in the verdict breakdown. */
export interface ScoreFactor {
  label: string;
  points: number;
  detail: string;
}

export interface SectionScore {
  /** -2 (very negative) .. +2 (very positive); null when the section had no usable data. */
  score: number | null;
  factors: ScoreFactor[];
  summary: string;
}
