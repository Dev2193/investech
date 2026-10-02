import { Link } from "react-router-dom";
import { BarChart3, Factory, Gavel, Landmark, MessageSquareQuote, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TickerSearch } from "@/components/research/TickerSearch";

const EXAMPLES = ["AAPL", "MSFT", "NVDA", "JPM", "KO", "TSLA"];

const SECTIONS = [
  { icon: BarChart3, title: "Company financials", text: "Revenue, profit, margins, EPS, cash, debt and growth from SEC filings." },
  { icon: Factory, title: "Industry outlook", text: "How the sector is trading versus the market and how fast peers are growing." },
  { icon: Trophy, title: "Industry position", text: "Competitors, revenue share and market cap versus peers over time." },
  { icon: MessageSquareQuote, title: "Market sentiment", text: "Analyst rating trends and the tone of recent news." },
  { icon: Landmark, title: "Economic factors", text: "Rates, inflation, growth, jobs and sector-specific indicators from FRED." },
  { icon: Gavel, title: "Conclusion", text: "A transparent Invest / Hold / Avoid score with every reason shown." },
];

const Research = () => (
  <div className="space-y-12">
    <section className="mx-auto max-w-2xl space-y-6 pt-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
        Research any US stock in <span className="text-primary">one page</span>
      </h1>
      <p className="text-lg text-muted-foreground">
        Enter a ticker to get a report on the company's financials, its industry, its competitors, market sentiment and the economy — built from
        real public data, with a transparent verdict.
      </p>
      <TickerSearch size="lg" />
      <div className="flex flex-wrap justify-center gap-2 text-sm">
        <span className="text-muted-foreground">Try:</span>
        {EXAMPLES.map((t) => (
          <Link key={t} to={`/stock/${t}`} className="rounded-full border border-border/60 px-3 py-1 hover:border-primary/50 hover:text-primary">
            {t}
          </Link>
        ))}
      </div>
    </section>

    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {SECTIONS.map(({ icon: Icon, title, text }) => (
        <Card key={title} className="border-border/50 bg-gradient-to-br from-card to-secondary/20 p-5">
          <Icon className="mb-3 h-5 w-5 text-primary" />
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{text}</p>
        </Card>
      ))}
    </section>

    <p className="text-center text-xs text-muted-foreground">
      Data: SEC EDGAR · FRED (St. Louis Fed) · Finnhub · Yahoo Finance price history. Covers companies that file with the SEC. Not financial advice.
    </p>
  </div>
);

export default Research;
