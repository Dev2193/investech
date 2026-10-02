import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Factory } from "lucide-react";
import type { StockResearch } from "@/hooks/useStockResearch";
import { industryMetrics } from "@/services/research/analysis";
import { formatPct } from "@/services/research/format";
import { toneOf } from "@/services/research/format";
import type { PricePoint } from "@/services/research/types";
import { ReportSection, Stat } from "./ReportSection";
import { EmptyNote, SectionError, SectionLoading } from "./SectionStatus";

const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 };

/** Rebase several price series to 100 at the first common date. */
function rebase(series: Record<string, PricePoint[]>, days = 365) {
  const names = Object.keys(series);
  const maps = names.map((n) => new Map(series[n].map((p) => [p.date, p.close])));
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const dates = series[names[0]].map((p) => p.date).filter((d) => d >= cutoff && maps.every((m) => m.has(d)));
  if (!dates.length) return [];
  const base = maps.map((m) => m.get(dates[0]) as number);
  return dates.map((d) => {
    const row: Record<string, number | string> = { date: d };
    names.forEach((n, i) => (row[n] = Number((((maps[i].get(d) as number) / base[i]) * 100).toFixed(2))));
    return row;
  });
}

function outlookText(r: StockResearch) {
  const m = industryMetrics(r.industryInputs);
  const s = r.sector;
  if (!s || m.sector12m === null || m.market12m === null) return null;
  const rel12 = m.sector12m - m.market12m;
  const rel3 = m.sector3m !== null && m.market3m !== null ? m.sector3m - m.market3m : null;
  const parts: string[] = [];
  parts.push(
    `${s.name} (${s.etf}) returned ${formatPct(m.sector12m, 1, true)} over the past 12 months versus ${formatPct(m.market12m, 1, true)} for the S&P 500, ` +
      (rel12 > 0.05 ? "so investors have been favouring the sector." : rel12 < -0.05 ? "so the sector has lagged the broad market." : "roughly in line with the market."),
  );
  if (rel3 !== null) {
    parts.push(
      rel3 > 0.02
        ? "Over the last 3 months it has been gaining momentum relative to the market, suggesting improving expectations."
        : rel3 < -0.02
          ? "Over the last 3 months it has been losing ground relative to the market, suggesting expectations are softening."
          : "Over the last 3 months it has moved in step with the market.",
    );
  }
  if (m.aboveSma200 !== null) parts.push(m.aboveSma200 ? "The sector ETF is above its 200-day average (a long-term uptrend)." : "The sector ETF is below its 200-day average (a long-term downtrend).");
  if (r.industryInputs.peerMedianRevenueGrowth !== null) {
    parts.push(`Close peers grew revenue by a median ${formatPct(r.industryInputs.peerMedianRevenueGrowth, 1)} in their latest fiscal year, a read on underlying industry demand.`);
  }
  return parts.join(" ");
}

export function IndustrySection({ r }: { r: StockResearch }) {
  const m = industryMetrics(r.industryInputs);
  const loading = r.submissions.isLoading || r.sectorPrice.isLoading || r.marketPrice.isLoading;
  const error = r.sectorPrice.error || r.marketPrice.error;
  const chart =
    r.sector && r.sectorPrice.data && r.marketPrice.data && r.price.data
      ? rebase({ [r.ticker]: r.price.data.points, [r.sector.etf]: r.sectorPrice.data.points, SPY: r.marketPrice.data.points })
      : [];
  const text = outlookText(r);

  return (
    <ReportSection
      id="industry"
      icon={<Factory className="h-5 w-5" />}
      title="Industry outlook"
      description="How the company's sector is trading versus the market — prices reflect investors' expectations for the months ahead."
      score={r.scores.industry}
      sources="Sector from SEC SIC code; SPDR sector ETF and SPY prices from Yahoo Finance; peer revenue growth from SEC EDGAR."
    >
      {loading ? (
        <SectionLoading label="Loading sector performance…" />
      ) : !r.sector ? (
        <EmptyNote>Sector unknown: it comes from the SEC SIC code (needs SEC EDGAR) or Finnhub's industry label, and neither is available right now.</EmptyNote>
      ) : error ? (
        <SectionError error={error} what="industry outlook" />
      ) : (
        <>
          {text && <p className="text-sm leading-relaxed">{text}</p>}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label={`${r.sector.etf} 3 months`} value={formatPct(m.sector3m, 1, true)} hint={`S&P 500: ${formatPct(m.market3m, 1, true)}`} tone={toneOf(m.sector3m)} />
            <Stat label={`${r.sector.etf} 6 months`} value={formatPct(m.sector6m, 1, true)} hint={`S&P 500: ${formatPct(m.market6m, 1, true)}`} tone={toneOf(m.sector6m)} />
            <Stat label={`${r.sector.etf} 12 months`} value={formatPct(m.sector12m, 1, true)} hint={`S&P 500: ${formatPct(m.market12m, 1, true)}`} tone={toneOf(m.sector12m)} />
            <Stat label="Peer median revenue growth" value={formatPct(r.industryInputs.peerMedianRevenueGrowth, 1, true)} hint={r.industryInputs.peerMedianRevenueGrowth === null ? "Needs peer list (Finnhub)" : "Latest fiscal year"} tone={toneOf(r.industryInputs.peerMedianRevenueGrowth)} />
          </div>
          {chart.length > 1 && (
            <div className="h-64">
              <p className="mb-2 text-sm text-muted-foreground">Last 12 months, rebased to 100</p>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} minTickGap={40} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} domain={["auto", "auto"]} width={40} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Line type="monotone" dataKey={r.ticker} stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey={r.sector.etf} stroke="hsl(var(--warning))" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="SPY" stroke="hsl(var(--muted-foreground))" dot={false} strokeWidth={1.5} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Note: free data sources don't provide forward analyst forecasts for whole industries, so the outlook is inferred from market pricing (relative performance and trend) and peers' reported growth.
          </p>
        </>
      )}
    </ReportSection>
  );
}
