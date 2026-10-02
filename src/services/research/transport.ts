import { supabase } from "@/integrations/supabase/client";

/**
 * Transport for all stock-research data requests.
 *
 * Production (Lovable / deployed app): calls the `stock-research` Supabase edge
 * function, which holds the API keys and proxies SEC EDGAR, FRED, Finnhub and
 * Yahoo Finance price history.
 *
 * Local development: set VITE_RESEARCH_TRANSPORT=local to use the identical
 * handler served by the Vite dev server at /api/research (see vite.config.ts).
 */
export type ResearchSource = "sec" | "yahoo" | "fred" | "finnhub" | "status";

export type ResearchErrorCode =
  | "missing_key"
  | "rate_limited"
  | "not_found"
  | "bad_request"
  | "upstream"
  | "network";

export class ResearchError extends Error {
  constructor(
    public code: ResearchErrorCode,
    message: string,
    public source: string,
  ) {
    super(message);
    this.name = "ResearchError";
  }
}

type Envelope<T> =
  | { ok: true; data: T }
  | { ok: false; code: ResearchErrorCode; message: string; source: string };

const FUNCTION_NAME = "stock-research";
const useLocal = import.meta.env.VITE_RESEARCH_TRANSPORT === "local";

export async function researchRequest<T>(
  source: ResearchSource,
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const body = { source, path, params };
  let envelope: Envelope<T>;

  if (useLocal) {
    let res: Response;
    try {
      res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {
      throw new ResearchError("network", `Could not reach the local research proxy: ${(e as Error).message}`, source);
    }
    if (!res.ok) throw new ResearchError("network", `Local research proxy returned HTTP ${res.status}.`, source);
    envelope = (await res.json()) as Envelope<T>;
  } else {
    const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, { body });
    if (error) {
      throw new ResearchError(
        "network",
        `The "${FUNCTION_NAME}" backend function is unreachable (${error.message}). Make sure the app's Supabase project is connected and the function is deployed.`,
        source,
      );
    }
    envelope = data as Envelope<T>;
  }

  if (!envelope || typeof envelope !== "object") {
    throw new ResearchError("upstream", "Unexpected response from the research backend.", source);
  }
  if (envelope.ok === false) {
    const err = envelope as Extract<Envelope<T>, { ok: false }>;
    throw new ResearchError(err.code, err.message, err.source || source);
  }
  return (envelope as Extract<Envelope<T>, { ok: true }>).data;
}

export interface BackendStatus {
  finnhub: boolean;
  fredApiKey: boolean;
  secUserAgent: boolean;
}

export const getBackendStatus = () => researchRequest<BackendStatus>("status", "status");
