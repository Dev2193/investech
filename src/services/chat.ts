import { apiRequest } from "@/lib/api";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

/** Send the conversation to the API server, which calls OpenAI with a server-side key. */
export async function sendChat(messages: ChatMessage[]): Promise<{ content: string; model: string }> {
  return apiRequest(
    "/api/chat",
    { method: "POST", body: JSON.stringify({ messages: messages.map(({ role, content }) => ({ role, content })) }) },
    "openai",
  );
}
