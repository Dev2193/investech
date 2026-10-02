import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { config } from "./config.js";
import { rateLimit } from "./lib/rateLimit.js";
import { cacheStats } from "./lib/cache.js";
import { research } from "./routes/research.js";
import { chat } from "./routes/chat.js";

export const app = new Hono();

app.use("*", logger());
app.use(
  "/api/*",
  cors({
    origin: config.allowedOrigins.includes("*") ? "*" : config.allowedOrigins,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    maxAge: 86400,
  }),
);

app.get("/", (c) => c.json({ name: "InvesTech.AI API", health: "/health", status: "/api/status" }));
app.get("/health", (c) => c.json({ ok: true }));

/** Which optional integrations are configured (booleans only — never the values). */
app.get("/api/status", (c) =>
  c.json({
    ok: true,
    data: {
      secUserAgent: Boolean(config.secUserAgent),
      finnhub: Boolean(config.finnhubApiKey),
      fredApiKey: Boolean(config.fredApiKey),
      openai: Boolean(config.openaiApiKey),
      openaiModel: config.openaiApiKey ? config.openaiModel : null,
      cache: cacheStats(),
    },
  }),
);

app.use("/api/research", rateLimit("api", config.rateLimitResearchPerMin));
app.route("/api/research", research);
app.use("/api/chat", rateLimit("chat", config.rateLimitChatPerMin));
app.route("/api/chat", chat);

app.notFound((c) => c.json({ ok: false, code: "not_found", message: "Not found", source: "api" }, 404));
