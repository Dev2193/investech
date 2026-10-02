import { useState, useRef, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Send, Bot, User, Key, Zap } from "lucide-react";
import { OpenAIService, ChatMessage } from '@/services/openai';
import { useToast } from '@/hooks/use-toast';
import { CONFIG } from '@/config/constants';

export function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleApiKeySubmit = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key to continue.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate API key format
    if (!apiKey.startsWith('sk-')) {
      toast({
        title: "Invalid API Key",
        description: "OpenAI API keys should start with 'sk-'",
        variant: "destructive"
      });
      return;
    }
    
    // Log first 10 characters for confirmation (similar to Python example)
    console.log('API Key loaded:', apiKey.substring(0, 10) + '...');
    
    toast({
      title: "API Key Loaded",
      description: `Key confirmed: ${apiKey.substring(0, 10)}...`,
      variant: "default"
    });
    
    setShowApiKeyInput(false);
    
    // Add welcome message
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: 'Hello! I\'m your AI financial analyst. Ask me anything about companies, sectors or financial markets. For a data-backed report on a specific stock, use the Research page.',
      timestamp: Date.now()
    };
    setMessages([welcomeMessage]);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const openaiService = new OpenAIService(apiKey);
      const response = await openaiService.sendMessage([...messages, userMessage]);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response from AI. Please check your API key.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showApiKeyInput) {
        handleApiKeySubmit();
      } else {
        sendMessage();
      }
    }
  };

  if (showApiKeyInput) {
    return (
      <Card className="p-6 bg-gradient-to-br from-card to-secondary/20 border-border/50">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">AI Financial Assistant</h3>
              <p className="text-sm text-muted-foreground">Configure your OpenAI API key to get started</p>
            </div>
          </div>

          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Key className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium text-warning-foreground">API Key Required</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              For security, consider connecting to Supabase to store your API key safely. 
              For now, enter your OpenAI API key below (stored in browser session only).
            </p>
          </div>

          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <MessageCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive-foreground">Educational Disclaimer</span>
            </div>
            <p className="text-xs text-muted-foreground">
              <strong>IMPORTANT:</strong> This AI assistant is for educational and informational purposes only. 
              All financial advice, predictions, and analysis should not be considered as professional investment advice. 
              Always consult with qualified financial advisors before making investment decisions. Past performance does not guarantee future results.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex space-x-2">
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleApiKeySubmit} className="bg-primary hover:bg-primary/90">
                <Zap className="h-4 w-4 mr-2" />
                Connect
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px] bg-gradient-to-br from-card to-secondary/20 border-border/50">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">AI Financial Assistant</h3>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
                <Bot className="h-3 w-3 mr-1" />
                Online
              </Badge>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                {CONFIG.OPENAI_MODEL}
              </Badge>
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowApiKeyInput(true)}
          className="text-xs"
        >
          <Key className="h-3 w-3 mr-1" />
          Change Key
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex items-start space-x-3 ${
              message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              <div className={`p-2 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-primary/20 border border-primary/30' 
                  : 'bg-secondary/30 border border-border/30'
              }`}>
                {message.role === 'user' ? (
                  <User className="h-4 w-4 text-primary" />
                ) : (
                  <Bot className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className={`flex-1 space-y-1 ${
                message.role === 'user' ? 'text-right' : ''
              }`}>
                <div className={`inline-block max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-foreground border border-border/30'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.timestamp && (
                  <p className="text-xs text-muted-foreground px-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                )}
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
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      <Separator />
      
      <div className="p-4">
        <div className="space-y-3">
          <div className="flex space-x-2">
            <Input
              placeholder="Ask about a company, sector, or market trend..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={isLoading || !input.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}