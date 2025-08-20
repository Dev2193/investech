import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AIChat } from "./components/AIChat";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              InvesTech.AI
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              AI-powered financial sentiment analysis and market prediction
            </p>
          </div>
          <AIChat />
        </div>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
