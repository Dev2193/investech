import type { MiddlewareHandler } from "hono";
import { getConnInfo } from "@hono/node-server/conninfo";

/**
 * Fixed-window, per-client rate limit (in memory). Protects the shared upstream
 * quotas (SEC, Finnhub, OpenAI) from a single noisy client. For multi-instance
 * deployments put a shared limiter (e.g. Redis) or the platform's limiter in front.
 */
export function rateLimit(name: string, perMinute: number): MiddlewareHandler {
  const hits = new Map<string, { windowStart: number; count: number }>();
  return async (c, next) => {
    const fwd = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
    let ip = fwd;
    if (!ip) {
      try {
        ip = getConnInfo(c).remote.address;
      } catch {
        ip = "unknown";
      }
    }
    const key = ip ?? "unknown";
    const now = Date.now();
    const rec = hits.get(key);
    if (!rec || now - rec.windowStart >= 60_000) {
      hits.set(key, { windowStart: now, count: 1 });
    } else if (++rec.count > perMinute) {
      const retry = Math.ceil((60_000 - (now - rec.windowStart)) / 1000);
      c.header("Retry-After", String(retry));
      return c.json(
        { ok: false, code: "rate_limited", message: `Too many requests. Try again in ${retry}s.`, source: name },
        429,
      );
    }
    if (hits.size > 10_000) hits.clear();
    await next();
  };
}
