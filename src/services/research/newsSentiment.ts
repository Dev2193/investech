/**
 * Transparent, dictionary-based headline sentiment (no ML model, no external call).
 * Each headline scores (positive hits - negative hits), clamped to [-1, 1].
 * Crude by design, but the method is fully visible to the user.
 */
const POSITIVE = [
  "beat", "beats", "surge", "surges", "soar", "soars", "jump", "jumps", "rally", "rallies", "gain", "gains",
  "record", "upgrade", "upgrades", "upgraded", "outperform", "bullish", "strong", "growth", "profit", "profits",
  "raise", "raises", "raised", "boost", "boosts", "expand", "expands", "expansion", "win", "wins", "approval",
  "approved", "partnership", "buyback", "dividend", "rise", "rises", "rising", "optimistic", "breakthrough",
  "top", "tops", "exceed", "exceeds", "rebound", "momentum", "buy", "higher", "best", "accelerate",
];
const NEGATIVE = [
  "miss", "misses", "missed", "plunge", "plunges", "drop", "drops", "fall", "falls", "slump", "slumps", "tumble",
  "tumbles", "downgrade", "downgrades", "downgraded", "underperform", "bearish", "weak", "loss", "losses", "cut",
  "cuts", "lawsuit", "sue", "sued", "probe", "investigation", "recall", "layoff", "layoffs", "decline", "declines",
  "warning", "warns", "risk", "risks", "fraud", "fine", "fined", "halt", "slow", "slowdown", "lower", "worst",
  "concern", "concerns", "fears", "sell", "selloff", "bankruptcy", "default", "antitrust", "delay", "delays",
];
const POS = new Set(POSITIVE);
const NEG = new Set(NEGATIVE);

export interface HeadlineScore {
  headline: string;
  score: number;
  positives: string[];
  negatives: string[];
}

export function scoreHeadline(headline: string): HeadlineScore {
  const words = headline.toLowerCase().match(/[a-z']+/g) ?? [];
  const positives = words.filter((w) => POS.has(w));
  const negatives = words.filter((w) => NEG.has(w));
  const raw = positives.length - negatives.length;
  return { headline, score: Math.max(-1, Math.min(1, raw / 2)), positives, negatives };
}

export function aggregateHeadlines(headlines: string[]) {
  const scored = headlines.map(scoreHeadline);
  const n = scored.length;
  const avg = n ? scored.reduce((s, h) => s + h.score, 0) / n : 0;
  return {
    count: n,
    average: avg,
    positive: scored.filter((h) => h.score > 0).length,
    negative: scored.filter((h) => h.score < 0).length,
    neutral: scored.filter((h) => h.score === 0).length,
    scored,
  };
}
