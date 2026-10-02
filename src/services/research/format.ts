export function formatMoney(n: number | null | undefined, currency = "USD"): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const sym = currency === "USD" ? "$" : "";
  if (abs >= 1e12) return `${sign}${sym}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${sym}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${sym}${(abs / 1e6).toFixed(1)}M`;
  return `${sign}${sym}${abs.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function formatPct(n: number | null | undefined, digits = 1, signed = false): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  const s = (n * 100).toFixed(digits);
  return `${signed && n > 0 ? "+" : ""}${s}%`;
}

export function formatNumber(n: number | null | undefined, digits = 2, suffix = ""): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return `${n.toFixed(digits)}${suffix}`;
}

export const toneOf = (n: number | null | undefined): "pos" | "neg" | undefined =>
  n === null || n === undefined ? undefined : n > 0 ? "pos" : n < 0 ? "neg" : undefined;
