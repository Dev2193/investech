import { useParams } from "react-router-dom";
import { useStockResearch } from "@/hooks/useStockResearch";
import { CompanyHeader } from "@/components/research/CompanyHeader";
import { FinancialsSection } from "@/components/research/FinancialsSection";
import { IndustrySection } from "@/components/research/IndustrySection";
import { PositionSection } from "@/components/research/PositionSection";
import { SentimentSection } from "@/components/research/SentimentSection";
import { EconomySection } from "@/components/research/EconomySection";
import { VerdictSection } from "@/components/research/VerdictSection";
import { SectionError, SectionLoading } from "@/components/research/SectionStatus";
import { TickerSearch } from "@/components/research/TickerSearch";
import { ResearchError } from "@/services/research/transport";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ServerCrash } from "lucide-react";

const NAV = [
  ["financials", "Financials"],
  ["industry", "Industry"],
  ["position", "Position"],
  ["sentiment", "Sentiment"],
  ["economy", "Economy"],
  ["verdict", "Conclusion"],
] as const;

const StockReport = () => {
  const { ticker = "" } = useParams();
  const r = useStockResearch(ticker);
  const unknown = r.company.error instanceof ResearchError && r.company.error.code === "not_found" && !r.price.data && !r.price.isLoading;

  const backendDown = r.company.error instanceof ResearchError && r.company.error.code === "network" && !!r.price.error;
  if (backendDown) {
    return (
      <Card className="mx-auto max-w-2xl space-y-4 border-warning/40 p-8">
        <div className="flex items-center gap-3 text-warning">
          <ServerCrash className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Research backend not connected</h2>
        </div>
        <p className="text-muted-foreground">
          The report for <span className="font-semibold text-foreground">{r.ticker}</span> is built by the <code className="rounded bg-muted px-1">stock-research</code>{" "}
          Supabase edge function, which fetches SEC, FRED, Finnhub and price data server-side (those sources can't be called directly from a browser). The
          function couldn't be reached, so no data is shown.
        </p>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Connect (or reconnect) Supabase for this project in Lovable so the edge functions in <code>supabase/functions</code> are deployed.</li>
          <li>
            Add the edge-function secret <code>SEC_USER_AGENT</code> (e.g. "InvesTech.AI you@yourdomain.com") — required by SEC EDGAR.
          </li>
          <li>
            Optional: add <code>FINNHUB_API_KEY</code> (free at finnhub.io/register) for peers, analyst ratings, news and market cap.
          </li>
        </ol>
        <p className="text-xs text-muted-foreground">Details: {(r.company.error as Error).message}</p>
      </Card>
    );
  }

  if (unknown) {
    return (
      <Card className="mx-auto max-w-xl space-y-4 p-8 text-center">
        <h2 className="text-2xl font-bold">Unknown ticker "{r.ticker}"</h2>
        <p className="text-muted-foreground">
          We couldn't find this symbol in SEC EDGAR or market data. This tool covers companies that file with the US SEC. Check the spelling and try
          again.
        </p>
        <TickerSearch />
      </Card>
    );
  }

  const verdictTone =
    r.verdict.label === "Invest" ? "text-success" : r.verdict.label === "Avoid" ? "text-destructive" : r.verdict.label === "Hold" ? "text-warning" : "text-muted-foreground";

  return (
    <div className="space-y-6">
      {r.company.isLoading && r.price.isLoading ? <SectionLoading label={`Looking up ${r.ticker}…`} /> : <CompanyHeader r={r} />}
      {r.company.error && !(r.company.error instanceof ResearchError && r.company.error.code === "not_found") && (
        <SectionError error={r.company.error} what="company lookup" />
      )}

      <nav className="sticky top-[61px] z-20 -mx-2 flex flex-wrap items-center gap-1 rounded-lg border border-border/50 bg-background/90 px-2 py-2 text-sm backdrop-blur">
        {NAV.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="rounded-md px-3 py-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
            {label}
          </a>
        ))}
        <span className="ml-auto pr-2 text-muted-foreground">
          Verdict: <span className={cn("font-semibold", verdictTone)}>{r.verdict.label}</span>
          {r.stillLoading && " (loading…)"}
        </span>
      </nav>

      <FinancialsSection r={r} />
      <IndustrySection r={r} />
      <PositionSection r={r} />
      <SentimentSection r={r} />
      <EconomySection r={r} />
      <VerdictSection r={r} />
    </div>
  );
};

export default StockReport;
