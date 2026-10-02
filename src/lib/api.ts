/**
 * Client for the InvesTech.AI API server (see /server).
 *
 * Base URL comes from VITE_API_BASE_URL (e.g. https://investech-api.onrender.com).
 * Leave it empty to call the same origin — in local dev the Vite dev server proxies
 * /api to the API server on localhost:8787.
 */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "");

export type ApiErrorCode = "missing_key" | "rate_limited" | "not_found" | "bad_request" | "upstream" | "network";

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public source: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Envelope<T> = { ok: true; data: T } | { ok: false; code: ApiErrorCode; message: string; source: string };

const describeBase = () => API_BASE_URL || `${typeof window !== "undefined" ? window.location.origin : ""} (same origin)`;

/** Call an API route and unwrap the { ok, data } envelope. Unreachable API => code "network". */
export async function apiRequest<T>(path: string, init: RequestInit = {}, source = "api"): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
  } catch (e) {
    throw new ApiError("network", `Can't reach the InvesTech API at ${describeBase()}: ${(e as Error).message}`, source);
  }
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) {
    // e.g. a static host answering /api/* with index.html or a 404 page: no API behind this URL.
    throw new ApiError("network", `No InvesTech API answered at ${describeBase()} (HTTP ${res.status}).`, source);
  }
  let envelope: Envelope<T>;
  try {
    envelope = (await res.json()) as Envelope<T>;
  } catch {
    throw new ApiError("network", `The InvesTech API returned an unreadable response (HTTP ${res.status}).`, source);
  }
  if (!envelope || typeof envelope !== "object" || !("ok" in envelope)) {
    throw new ApiError("upstream", "Unexpected response from the InvesTech API.", source);
  }
  if (envelope.ok === false) {
    const err = envelope as Extract<Envelope<T>, { ok: false }>;
    throw new ApiError(err.code, err.message, err.source || source);
  }
  return (envelope as Extract<Envelope<T>, { ok: true }>).data;
}

export interface ApiStatus {
  secUserAgent: boolean;
  finnhub: boolean;
  fredApiKey: boolean;
  openai: boolean;
  openaiModel: string | null;
}

export const getApiStatus = () => apiRequest<ApiStatus>("/api/status");
