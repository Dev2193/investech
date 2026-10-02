import { AIChat } from "@/components/AIChat";

const Assistant = () => (
  <div className="mx-auto max-w-4xl space-y-6">
    <div className="text-center">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">AI Financial Assistant</h1>
      <p className="text-muted-foreground">Chat with an AI analyst about companies, sectors and markets.</p>
    </div>
    <AIChat />
  </div>
);

export default Assistant;
