export type ApiErrorCode = "missing_key" | "rate_limited" | "not_found" | "bad_request" | "upstream";

/** Expected, user-presentable failure. Serialized into the response envelope. */
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

export type Envelope<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; code: ApiErrorCode; message: string; source: string };

export function toEnvelope(e: unknown, source = "api"): Envelope<never> {
  if (e instanceof ApiError) return { ok: false, code: e.code, message: e.message, source: e.source };
  console.error("[api] unexpected error", e);
  return { ok: false, code: "upstream", message: "Unexpected server error.", source };
}
