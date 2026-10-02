import "./env.js";
import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { config } from "./config.js";

serve({ fetch: app.fetch, port: config.port, hostname: "0.0.0.0" }, (info) => {
  console.log(`InvesTech.AI API listening on http://localhost:${info.port}`);
  const missing = [
    !config.secUserAgent && "SEC_USER_AGENT (required for financials)",
    !config.finnhubApiKey && "FINNHUB_API_KEY (optional)",
    !config.openaiApiKey && "OPENAI_API_KEY (optional, AI chat)",
  ].filter(Boolean);
  if (missing.length) console.log(`Not configured: ${missing.join(", ")}`);
});
