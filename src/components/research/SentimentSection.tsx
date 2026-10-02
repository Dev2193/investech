import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MessageSquareQuote } from "lucide-react";
import type { StockResearch } from "@/hooks/useStockResearch";
import { recommendationScore } from "@/services/research/analysis";
import { scoreHeadline } from "@/services/research/newsSentiment";
import { ReportSection, Stat } from "./ReportSection";
import { EmptyNote, SectionError, SectionLoading } from "./SectionStatus";
import { cn } from "@/lib/utils";

const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 };

export function SentimentSection({ r }: { r: StockResearch }) {
  const recs = r.recs.data ? [...r.recs.data].sort((a, b) => (a.period < b.period ? -1 : 1)).slice(-6) : [];
  const latest = recs[recs.length - 1];
  const latestScore = latest ? recommendationScore(latest) : null;
  const agg = r.newsAgg;
  const sameError = r.recs.error && r.news.error && (r.recs.error as Error).message === (r.news.error as Error).message;

  return (
    <ReportSection
      id="sentiment"
      icon={<MessageSquareQuote className="h-5 w-5" />}
      title="Market sentiment"
      description="Are analysts and the news flow bullish or bearish?"
      score={r.scores.sentiment}
      sources="Analyst recommendation trends and company news from Finnhub; headline tone scored with a transparent word list; price momentum from Yahoo Finance."
    >
      {sameError ? (
        <SectionError error={r.recs.error} what="analyst ratings and news sentiment" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <h4 className="font-semibold">Analyst recommendations</h4>
            {r.recs.isLoading ? (
              <SectionLoading />
            ) : r.recs.error ? (
              <SectionError error={r.recs.error} what="analyst ratings" />
            ) : !recs.length ? (
              <EmptyNote>No analyst coverage reported.</EmptyNote>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Stat
                    label={`Consensus (${latest.period.slice(0, 7)})`}
                    value={latestScore === null ? "—" : latestScore > 1 ? "Strong buy" : latestScore > 0.4 ? "Buy" : latestScore < -0.4 ? "Sell" : "Hold"}
                    hint={latestScore !== null ? `${latestScore.toFixed(2)} on −2…+2` : undefined}
                    tone={latestScore !== null ? (latestScore > 0.4 ? "pos" : latestScore < 0 ? "neg" : undefined) : undefined}
                  />
                  <Stat label="Analysts" value={String(latest.strongBuy + latest.buy + latest.hold + latest.sell + latest.strongSell)} hint={`${latest.strongBuy + latest.buy} buy · ${latest.hold} hold · ${latest.sell + latest.strongSell} sell`} />
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={recs.map((x) => ({ ...x, period: x.period.slice(0, 7) }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} width={30} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="strongBuy" name="Strong buy" stackId="a" fill="hsl(142 71% 35%)" />
                      <Bar dataKey="buy" name="Buy" stackId="a" fill="hsl(var(--success))" />
                      <Bar dataKey="hold" name="Hold" stackId="a" fill="hsl(var(--warning))" />
                      <Bar dataKey="sell" name="Sell" stackId="a" fill="hsl(var(--destructive))" />
                      <Bar dataKey="strongSell" name="Strong sell" stackId="a" fill="hsl(0 72% 35%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">News flow (last 30 days)</h4>
            {r.news.isLoading ? (
              <SectionLoading />
            ) : r.news.error ? (
              <SectionError error={r.news.error} what="news sentiment" />
            ) : !agg || !agg.count ? (
              <EmptyNote>No company news in the last 30 days.</EmptyNote>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <Stat label="Positive" value={String(agg.positive)} tone="pos" />
                  <Stat label="Neutral" value={String(agg.neutral)} />
                  <Stat label="Negative" value={String(agg.negative)} tone="neg" />
                </div>
                <ul className="max-h-64 space-y-2 overflow-y-auto pr-1 text-sm">
                  {r.news.data!.slice(0, 15).map((n) => {
                    const s = scoreHeadline(n.headline);
                    return (
                      <li key={n.url + n.datetime} className="flex items-start gap-2">
                        <span
                          className={cn(
                            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                            s.score > 0 ? "bg-success" : s.score < 0 ? "bg-destructive" : "bg-muted-foreground",
                          )}
                          title={`Tone ${s.score.toFixed(2)}${s.positives.length ? ` · +${s.positives.join(", ")}` : ""}${s.negatives.length ? ` · −${s.negatives.join(", ")}` : ""}`}
                        />
                        <span>
                          <a href={n.url} target="_blank" rel="noreferrer" className="hover:text-primary">
                            {n.headline}
                          </a>
                          <span className="ml-1 text-xs text-muted-foreground">
                            {n.source} · {new Date(n.datetime * 1000).toLocaleDateString()}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="text-xs text-muted-foreground">Tone uses a simple keyword list (e.g. "beats", "upgrade" vs "misses", "lawsuit"); hover a dot to see the matched words.</p>
              </>
            )}
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Social-media sentiment and analyst price targets are not included: they require paid data plans.</p>
    </ReportSection>
  );
}
