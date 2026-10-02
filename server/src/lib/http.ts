import { ApiError } from "./errors.js";

/** fetch() wrapper that maps upstream failures to ApiErrors and enforces a timeout. */
export async function fetchUpstream(source: string, url: string, init: RequestInit = {}, timeoutMs = 15_000): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (e) {
    const msg = (e as Error).name === "TimeoutError" ? "timed out" : (e as Error).message;
    throw new ApiError("upstream", `Could not reach ${source} (${msg}).`, source);
  }
  if (res.status === 429) throw new ApiError("rate_limited", `${source} rate limit reached. Try again in a minute.`, source);
  if (res.status === 404) throw new ApiError("not_found", `${source} has no data for this request.`, source);
  if (res.status === 401 || res.status === 403) {
    throw new ApiError("upstream", `${source} rejected the request (HTTP ${res.status}). Check the API key / plan.`, source);
  }
  if (!res.ok) throw new ApiError("upstream", `${source} returned HTTP ${res.status}.`, source);
  return res;
}

export const TICKER_RE = /^[A-Z0-9.\-^=]{1,15}$/;
export const CIK_RE = /^\d{10}$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
