/**
 * Sector classification + sector-relevant macro indicators.
 * Sector is derived from the company's SEC SIC code (keyless) or, as a fallback,
 * Finnhub's industry label. Each sector maps to its SPDR Select Sector ETF, used
 * as a market-traded proxy for industry performance.
 */

export interface MacroIndicator {
  id: string; // FRED series id
  label: string;
  unit: "%" | "index" | "$";
  /** "yoy" = year-over-year % change of an index/level, "level" = the value itself. */
  transform: "yoy" | "level";
  /** +1 if a rising value is good for this company's sector, -1 if bad, 0 if ambiguous. */
  goodWhenRising: 1 | -1 | 0;
  relevance: string;
}

export interface SectorInfo {
  key: string;
  name: string;
  etf: string;
  /** 0..1, how much higher interest rates tend to weigh on the sector's valuations. */
  rateSensitivity: number;
  indicators: MacroIndicator[];
}

const INDPRO: MacroIndicator = {
  id: "INDPRO",
  label: "Industrial production (YoY)",
  unit: "%",
  transform: "yoy",
  goodWhenRising: 1,
  relevance: "Factory and utility output; rising output means more demand for industrial goods, equipment and materials.",
};
const RETAIL: MacroIndicator = {
  id: "RSAFS",
  label: "Retail sales (YoY)",
  unit: "%",
  transform: "yoy",
  goodWhenRising: 1,
  relevance: "Consumer spending at retailers; a direct read on demand for consumer-facing companies.",
};
const SENTIMENT: MacroIndicator = {
  id: "UMCSENT",
  label: "Consumer sentiment (U. Michigan)",
  unit: "index",
  transform: "level",
  goodWhenRising: 1,
  relevance: "How confident households feel; confident consumers spend more on discretionary items and services.",
};

export const SECTORS: Record<string, SectorInfo> = {
  tech: {
    key: "tech",
    name: "Information Technology",
    etf: "XLK",
    rateSensitivity: 0.8,
    indicators: [
      {
        id: "IPG3344S",
        label: "Semiconductor production (YoY)",
        unit: "%",
        transform: "yoy",
        goodWhenRising: 1,
        relevance: "US output of semiconductors and electronic components, a proxy for the hardware/chip cycle.",
      },
    ],
  },
  comm: { key: "comm", name: "Communication Services", etf: "XLC", rateSensitivity: 0.6, indicators: [SENTIMENT, RETAIL] },
  discretionary: {
    key: "discretionary",
    name: "Consumer Discretionary",
    etf: "XLY",
    rateSensitivity: 0.7,
    indicators: [RETAIL, SENTIMENT],
  },
  staples: {
    key: "staples",
    name: "Consumer Staples",
    etf: "XLP",
    rateSensitivity: 0.4,
    indicators: [
      RETAIL,
      {
        id: "CPIUFDSL",
        label: "Food CPI (YoY)",
        unit: "%",
        transform: "yoy",
        goodWhenRising: 0,
        relevance: "Food price inflation: supports pricing for producers but squeezes margins if input costs rise faster.",
      },
    ],
  },
  health: {
    key: "health",
    name: "Health Care",
    etf: "XLV",
    rateSensitivity: 0.4,
    indicators: [
      {
        id: "CPIMEDSL",
        label: "Medical care CPI (YoY)",
        unit: "%",
        transform: "yoy",
        goodWhenRising: 0,
        relevance: "Medical price inflation: indicates pricing power, but also political/regulatory pressure on prices.",
      },
    ],
  },
  financials: {
    key: "financials",
    name: "Financials",
    etf: "XLF",
    rateSensitivity: 0.2,
    indicators: [
      {
        id: "T10Y2Y",
        label: "10Y–2Y Treasury spread",
        unit: "%",
        transform: "level",
        goodWhenRising: 1,
        relevance: "Yield-curve steepness; banks borrow short and lend long, so a steeper curve tends to widen lending margins.",
      },
    ],
  },
  realestate: {
    key: "realestate",
    name: "Real Estate",
    etf: "XLRE",
    rateSensitivity: 1,
    indicators: [
      {
        id: "MORTGAGE30US",
        label: "30-year mortgage rate",
        unit: "%",
        transform: "level",
        goodWhenRising: -1,
        relevance: "Financing costs for property; higher mortgage rates cool real-estate demand and valuations.",
      },
    ],
  },
  energy: {
    key: "energy",
    name: "Energy",
    etf: "XLE",
    rateSensitivity: 0.3,
    indicators: [
      {
        id: "MCOILWTICO",
        label: "WTI crude oil price",
        unit: "$",
        transform: "level",
        goodWhenRising: 1,
        relevance: "Oil price drives revenue and cash flow for energy producers and service companies.",
      },
    ],
  },
  industrials: {
    key: "industrials",
    name: "Industrials",
    etf: "XLI",
    rateSensitivity: 0.5,
    indicators: [
      INDPRO,
      {
        id: "DGORDER",
        label: "Durable goods orders (YoY)",
        unit: "%",
        transform: "yoy",
        goodWhenRising: 1,
        relevance: "New orders for long-lasting goods (machinery, aircraft); a leading indicator for industrial demand.",
      },
    ],
  },
  materials: {
    key: "materials",
    name: "Materials",
    etf: "XLB",
    rateSensitivity: 0.4,
    indicators: [
      INDPRO,
      {
        id: "PPIACO",
        label: "Producer prices, all commodities (YoY)",
        unit: "%",
        transform: "yoy",
        goodWhenRising: 1,
        relevance: "Commodity price trend; materials producers generally benefit from rising commodity prices.",
      },
    ],
  },
  utilities: {
    key: "utilities",
    name: "Utilities",
    etf: "XLU",
    rateSensitivity: 0.9,
    indicators: [
      {
        id: "GS10",
        label: "10-year Treasury yield",
        unit: "%",
        transform: "level",
        goodWhenRising: -1,
        relevance: "Utilities are bought as bond substitutes and carry heavy debt; higher yields hurt both.",
      },
    ],
  },
};

const inRange = (n: number, a: number, b: number) => n >= a && n <= b;

/** Map an SEC SIC code to a sector (approximate, based on SIC division/major group). */
export function sectorFromSic(sicRaw: string | null | undefined): SectorInfo | null {
  const sic = Number(sicRaw);
  if (!Number.isFinite(sic) || sic <= 0) return null;
  const s = SECTORS;
  if (inRange(sic, 100, 999)) return s.staples;
  if (sic === 1311 || inRange(sic, 1380, 1389) || inRange(sic, 2900, 2999)) return s.energy;
  if (inRange(sic, 1000, 1499)) return s.materials;
  if (inRange(sic, 1500, 1799)) return s.industrials;
  if (inRange(sic, 2000, 2199)) return s.staples;
  if (inRange(sic, 2200, 2399)) return s.discretionary;
  if (inRange(sic, 2400, 2699)) return s.materials;
  if (inRange(sic, 2700, 2799)) return s.comm;
  if (inRange(sic, 2830, 2836)) return s.health;
  if (inRange(sic, 2840, 2844)) return s.staples;
  if (inRange(sic, 2800, 2899)) return s.materials;
  if (inRange(sic, 3000, 3399)) return s.materials;
  if (inRange(sic, 3400, 3499)) return s.industrials;
  if (inRange(sic, 3570, 3579)) return s.tech;
  if (inRange(sic, 3500, 3599)) return s.industrials;
  if (inRange(sic, 3630, 3639)) return s.discretionary;
  if (inRange(sic, 3600, 3699)) return s.tech;
  if (inRange(sic, 3710, 3716) || inRange(sic, 3750, 3799)) return s.discretionary;
  if (inRange(sic, 3700, 3799)) return s.industrials;
  if (inRange(sic, 3841, 3851)) return s.health;
  if (inRange(sic, 3800, 3899)) return s.tech;
  if (inRange(sic, 3900, 3999)) return s.discretionary;
  if (inRange(sic, 4000, 4799)) return s.industrials;
  if (inRange(sic, 4800, 4899)) return s.comm;
  if (inRange(sic, 4900, 4999)) return s.utilities;
  if (sic === 5122) return s.health;
  if (inRange(sic, 5000, 5199)) return s.industrials;
  if (sic === 5411 || sic === 5912 || sic === 5331) return s.staples;
  if (inRange(sic, 5200, 5999)) return s.discretionary;
  if (sic === 6798 || inRange(sic, 6500, 6599)) return s.realestate;
  if (inRange(sic, 6000, 6799)) return s.financials;
  if (inRange(sic, 7370, 7379)) return s.tech;
  if (inRange(sic, 7810, 7841)) return s.comm;
  if (inRange(sic, 7000, 7099) || inRange(sic, 7900, 7999)) return s.discretionary;
  if (inRange(sic, 8000, 8099)) return s.health;
  if (inRange(sic, 7000, 8999)) return s.industrials;
  return null;
}

/** Fallback mapping from Finnhub's `finnhubIndustry` label. */
export function sectorFromIndustryLabel(label: string | null | undefined): SectorInfo | null {
  if (!label) return null;
  const l = label.toLowerCase();
  const s = SECTORS;
  if (/semiconductor|technology|software|hardware|electronic/.test(l)) return s.tech;
  if (/media|telecom|communication|entertainment/.test(l)) return s.comm;
  if (/bank|insurance|financ|capital market/.test(l)) return s.financials;
  if (/real estate|reit/.test(l)) return s.realestate;
  if (/oil|gas|energy/.test(l)) return s.energy;
  if (/utilit/.test(l)) return s.utilities;
  if (/pharma|biotech|health|life science|medical/.test(l)) return s.health;
  if (/chemical|metal|mining|material|paper|packaging/.test(l)) return s.materials;
  if (/food|beverage|tobacco|consumer products/.test(l)) return s.staples;
  if (/retail|auto|hotel|restaurant|leisure|textile|apparel|consumer/.test(l)) return s.discretionary;
  if (/aerospace|machinery|industrial|airline|logistic|transport|construction|building|electrical/.test(l)) {
    return s.industrials;
  }
  return null;
}

/** Economy-wide indicators shown for every company. */
export const GENERAL_INDICATORS: MacroIndicator[] = [
  {
    id: "FEDFUNDS",
    label: "Fed funds rate",
    unit: "%",
    transform: "level",
    goodWhenRising: -1,
    relevance: "The Fed's policy rate sets borrowing costs; higher rates raise financing costs and lower the value of future earnings.",
  },
  {
    id: "CPIAUCSL",
    label: "CPI inflation (YoY)",
    unit: "%",
    transform: "yoy",
    goodWhenRising: -1,
    relevance: "Inflation erodes purchasing power and margins, and high inflation keeps interest rates elevated.",
  },
  {
    id: "A191RL1Q225SBEA",
    label: "Real GDP growth (annualized, QoQ)",
    unit: "%",
    transform: "level",
    goodWhenRising: 1,
    relevance: "Overall economic growth; faster growth generally lifts corporate revenues and earnings.",
  },
  {
    id: "UNRATE",
    label: "Unemployment rate",
    unit: "%",
    transform: "level",
    goodWhenRising: -1,
    relevance: "Labor-market health; rising unemployment usually precedes weaker consumer spending and recessions.",
  },
  {
    id: "GS10",
    label: "10-year Treasury yield",
    unit: "%",
    transform: "level",
    goodWhenRising: -1,
    relevance: "The benchmark 'risk-free' rate used to discount future cash flows; higher yields pressure stock valuations.",
  },
];
