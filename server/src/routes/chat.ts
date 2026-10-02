import { Hono } from "hono";
import { config } from "../config.js";
import { ApiError, toEnvelope } from "../lib/errors.js";
import { fetchUpstream } from "../lib/http.js";
import { SYSTEM_PROMPT } from "../chat/systemPrompt.js";

const MAX_MESSAGES = 30;
const MAX_CHARS = 8000;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function validate(body: unknown): ChatMessage[] {
  const msgs = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(msgs) || msgs.length === 0) throw new ApiError("bad_request", "messages must be a non-empty array.", "chat");
  return msgs.slice(-MAX_MESSAGES).map((m) => {
    const role = (m as ChatMessage)?.role;
    const content = (m as ChatMessage)?.content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string" || !content.trim()) {
      throw new ApiError("bad_request", "Each message needs role 'user' | 'assistant' and non-empty content.", "chat");
    }
    return { role, content: content.slice(0, MAX_CHARS) };
  });
}

/** POST /api/chat { messages } -> { ok: true, data: { content, model } }. The OpenAI key never leaves the server. */
export const chat = new Hono().post("/", async (c) => {
  try {
    if (!config.openaiApiKey) {
      throw new ApiError("missing_key", "The AI assistant isn't configured: set OPENAI_API_KEY on the API server.", "openai");
    }
    let body: unknown = null;
    try {
      body = await c.req.json();
    } catch {
      // validated below
    }
    const messages = validate(body);
    const res = await fetchUpstream(
      "OpenAI",
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${config.openaiApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: config.openaiModel,
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
          max_completion_tokens: 2000,
        }),
      },
      60_000,
    );
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content ?? "Sorry, I could not generate a response.";
    return c.json({ ok: true, data: { content, model: config.openaiModel } });
  } catch (e) {
    return c.json(toEnvelope(e, "openai"));
  }
});
