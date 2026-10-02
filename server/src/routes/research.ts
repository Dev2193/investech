import { Hono } from "hono";
import { ApiError, toEnvelope } from "../lib/errors.js";
import { secRoutes } from "../sources/sec.js";
import { yahooRoutes } from "../sources/yahoo.js";
import { fredRoutes } from "../sources/fred.js";
import { finnhubRoutes } from "../sources/finnhub.js";

/** One module per data source; each exposes an allow-list of paths. */
const SOURCES: Record<string, Record<string, (p: Record<string, string>) => Promise<unknown>>> = {
  sec: secRoutes,
  yahoo: yahooRoutes,
  fred: fredRoutes,
  finnhub: finnhubRoutes,
};

/**
 * POST /api/research  { source, path, params }  ->  { ok: true, data } | { ok: false, code, message, source }
 * Always HTTP 200 for expected failures so the client can show a precise message.
 */
export const research = new Hono().post("/", async (c) => {
  let body: { source?: unknown; path?: unknown; params?: unknown } | null = null;
  try {
    body = await c.req.json();
  } catch {
    // handled below
  }
  const source = typeof body?.source === "string" ? body.source : "";
  try {
    const path = typeof body?.path === "string" ? body.path : "";
    const handler = SOURCES[source]?.[path];
    if (!handler) throw new ApiError("bad_request", `Unknown data request "${source}/${path}".`, source || "api");
    const params: Record<string, string> = {};
    if (body?.params && typeof body.params === "object") {
      for (const [k, v] of Object.entries(body.params as Record<string, unknown>)) {
        if (v !== undefined && v !== null) params[k] = String(v).slice(0, 64);
      }
    }
    const data = await handler(params);
    c.header("Cache-Control", "private, max-age=300");
    return c.json({ ok: true, data });
  } catch (e) {
    return c.json(toEnvelope(e, source || "api"));
  }
});
