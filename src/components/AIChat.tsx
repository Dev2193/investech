import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Send, Bot, User, KeyRound, ServerCrash, Loader2 } from "lucide-react";
import { sendChat, type ChatMessage } from "@/services/chat";
import { ApiError, getApiStatus } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Hello! I'm your AI financial analyst. Ask me anything about companies, sectors or financial markets. For a data-backed report on a specific stock, use the Research page.",
};

function Disclaimer() {
  return (
    <p className="text-xs text-muted-foreground">
      <strong>Educational use only.</strong> AI answers can be wrong or out of date and are not professional investment advice. Always consult a qualified
      financial adviser before investing.
    </p>
  );
}

export function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([{ ...WELCOME, timestamp: Date.now() }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const status = useQuery({ queryKey: ["api-status"], queryFn: getApiStatus, retry: 1, staleTime: 60_000 });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: ChatMessage = { role: "user", content: input, timestamp: Date.now() };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput("");
    setIsLoading(true);
    try {
      // The welcome message is UI-only; don't send it to the model.
      const { content } = await sendChat(history.slice(1));
      setMessages((prev) => [...prev, { role: "assistant", content, timestamp: Date.now() }]);
    } catch (error) {
      toast({
        title: "AI assistant error",
        description: error instanceof Error ? error.message : "Failed to get a response.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const header = (
    <div className="flex items-center space-x-3">
      <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
        <MessageCircle className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-foreground">AI Financial Assistant</h3>
        {status.data?.openai && (
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
              <Bot className="h-3 w-3 mr-1" />
              Online
            </Badge>
            {status.data.openaiModel && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                {status.data.openaiModel}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (status.isLoading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-card to-secondary/20 border-border/50 space-y-4">
        {header}
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Connecting to the InvesTech API…
        </p>
      </Card>
    );
  }

  if (status.error || !status.data?.openai) {
    const unreachable = status.error instanceof ApiError && status.error.code === "network";
    return (
      <Card className="p-6 bg-gradient-to-br from-card to-secondary/20 border-border/50 space-y-4">
        {header}
        <div className="rounded-lg border border-warning/40 bg-warning/5 p-4 text-sm space-y-2">
          <div className="flex items-center gap-2 font-medium text-warning">
            {unreachable ? <ServerCrash className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
            {unreachable ? "Backend not connected" : "AI assistant not configured"}
          </div>
          <p className="text-muted-foreground">
            {unreachable
              ? `${(status.error as Error).message}. Run the API server (npm run dev) or set VITE_API_BASE_URL to a deployed API.`
              : status.error
                ? (status.error as Error).message
                : "Set OPENAI_API_KEY on the API server to enable chat. The key stays on the server and is never sent to the browser."}
          </p>
        </div>
        <Disclaimer />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px] bg-gradient-to-br from-card to-secondary/20 border-border/50">
      <div className="flex items-center justify-between p-4 border-b border-border/50">{header}</div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex items-start space-x-3 ${message.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
              <div className={`p-2 rounded-lg ${message.role === "user" ? "bg-primary/20 border border-primary/30" : "bg-secondary/30 border border-border/30"}`}>
                {message.role === "user" ? <User className="h-4 w-4 text-primary" /> : <Bot className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className={`flex-1 space-y-1 ${message.role === "user" ? "text-right" : ""}`}>
                <div
                  className={`inline-block max-w-[80%] p-3 rounded-lg ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-foreground border border-border/30"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.timestamp && <p className="text-xs text-muted-foreground px-1">{new Date(message.timestamp).toLocaleTimeString()}</p>}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-secondary/30 border border-border/30">
                <Bot className="h-4 w-4 text-muted-foreground animate-pulse" />
              </div>
              <div className="bg-secondary/50 border border-border/30 rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      <Separator />

      <div className="p-4 space-y-2">
        <div className="flex space-x-2">
          <Input
            placeholder="Ask about a company, sector, or market trend..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={isLoading || !input.trim()} className="bg-primary hover:bg-primary/90">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <Disclaimer />
      </div>
    </Card>
  );
}
