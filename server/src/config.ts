/** All configuration comes from environment variables (see .env.example). */
const env = (name: string) => {
  const v = process.env[name]?.trim();
  return v ? v : undefined;
};

export const config = {
  port: Number(env("PORT") ?? 8787),
  /** Comma-separated list of allowed browser origins, or "*" (default). */
  allowedOrigins: (env("ALLOWED_ORIGINS") ?? "*").split(",").map((s) => s.trim()).filter(Boolean),
  secUserAgent: env("SEC_USER_AGENT"),
  finnhubApiKey: env("FINNHUB_API_KEY"),
  fredApiKey: env("FRED_API_KEY"),
  openaiApiKey: env("OPENAI_API_KEY"),
  openaiModel: env("OPENAI_MODEL") ?? "gpt-4.1-2025-04-14",
  /** Per-client (IP) request budgets, per minute. */
  rateLimitResearchPerMin: Number(env("RATE_LIMIT_RESEARCH_PER_MIN") ?? 300),
  rateLimitChatPerMin: Number(env("RATE_LIMIT_CHAT_PER_MIN") ?? 20),
};
