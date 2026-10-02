import { ApiError, apiRequest } from "@/lib/api";

/**
 * Transport for all stock-research data requests: POST /api/research on the
 * InvesTech API server, which proxies SEC EDGAR, FRED, Finnhub and Yahoo Finance
 * (keys stay server-side; those sources also block direct browser calls).
 */
export type ResearchSource = "sec" | "yahoo" | "fred" | "finnhub";

export { ApiError as ResearchError };
export type { ApiErrorCode as ResearchErrorCode } from "@/lib/api";

export function researchRequest<T>(
  source: ResearchSource,
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  return apiRequest<T>("/api/research", { method: "POST", body: JSON.stringify({ source, path, params }) }, source);
}
