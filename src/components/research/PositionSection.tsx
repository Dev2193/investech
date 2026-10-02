import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StockResearch } from "@/hooks/useStockResearch";
import { positionMetrics } from "@/services/research/analysis";
import { formatMoney, formatPct } from "@/services/research/format";
import { ReportSection, Stat } from "./ReportSection";
import { EmptyNote, SectionError, SectionLoading } from "./SectionStatus";
import { cn } from "@/lib/utils";

const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 };

export function PositionSection({ r }: { r: StockResearch }) {
  const m = positionMetrics(r.peerRows);
  const peers = r.peerRows.filter((p) => !p.isSubject);
  const capChart = r.peerRows.filter((p) => p.marketCap !== null).sort((a, b) => (b.marketCap as number) - (a.marketCap as number));
  const failedPeers = r.peerQueries.filter((q) => q.error).length;

  return (
    <ReportSection
      id="position"
      icon={<Trophy className="h-5 w-5" />}
      title="Position in its industry"
      description="How the company stacks up against close competitors, and whether it is gaining or losing ground."
      score={r.scores.position}
      sources="Peer list and market caps from Finnhub; revenue and margins from each company's SEC 10-K filings."
    >
      {r.peersQ.isLoading ? (
        <SectionLoading label="Finding competitors…" />
      ) : r.peersQ.error ? (
        <SectionError error={r.peersQ.error} what="competitor comparison" />
      ) : r.peerTickers.length === 0 ? (
        <EmptyNote>No US-listed peers were returned for this company.</EmptyNote>
      ) : r.peersLoading ? (
        <SectionLoading label={`Loading filings for ${r.peerTickers.join(", ")}…`} />
      ) : peers.length === 0 ? (
        <EmptyNote>Peers were found ({r.peerTickers.join(", ")}) but none had usable SEC revenue data.</EmptyNote>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Revenue rank in group" value={m.revRank ? `#${m.revRank} of ${m.revCount}` : "—"} />
            <Stat label="Market-cap rank in group" value={m.capRank ? `#${m.capRank} of ${m.capCount}` : "—"} />
            <Stat
              label="Revenue growth vs peers"
              value={formatPct(m.subj?.revenueGrowth ?? null, 1, true)}
              hint={`Peer median ${formatPct(m.peerGrowth, 1, true)}`}
            />
            <Stat
              label="Share of group revenue"
              value={m.shares.length ? formatPct(m.shares[m.shares.length - 1].share) : "—"}
              hint={m.shares.length > 1 ? `${formatPct(m.shares[0].share)} in FY${m.shares[0].year}` : undefined}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {m.shares.length > 1 && (
              <div className="h-60">
                <p className="mb-2 text-sm text-muted-foreground">{r.ticker}'s share of peer-group revenue (market-share proxy)</p>
                <ResponsiveContainer width="100%" height="90%">
                  <LineChart data={m.shares.map((s) => ({ year: `FY${s.year}`, share: Number((s.share * 100).toFixed(1)) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} unit="%" width={45} domain={["auto", "auto"]} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
                    <Line type="monotone" dataKey="share" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {capChart.length > 1 && (
              <div className="h-60">
                <p className="mb-2 text-sm text-muted-foreground">Market capitalization vs peers</p>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart data={capChart.map((p) => ({ ticker: p.ticker, cap: p.marketCap, subject: p.isSubject }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="ticker" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => formatMoney(v)} width={60} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v)} />
                    <Bar dataKey="cap" name="Market cap" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead className="text-right">Latest revenue</TableHead>
                  <TableHead className="text-right">Revenue growth</TableHead>
                  <TableHead className="text-right">Net margin</TableHead>
                  <TableHead className="text-right">Market cap</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {r.peerRows.map((p) => (
                  <TableRow key={p.ticker} className={cn(p.isSubject && "bg-primary/5")}>
                    <TableCell>
                      {p.isSubject ? (
                        <span className="font-semibold text-primary">{p.ticker}</span>
                      ) : (
                        <Link to={`/stock/${p.ticker}`} className="font-medium hover:text-primary">
                          {p.ticker}
                        </Link>
                      )}
                      <span className="ml-2 text-xs text-muted-foreground">{p.name}</span>
                    </TableCell>
                    <TableCell className="text-right">{formatMoney(p.latestRevenue)}</TableCell>
                    <TableCell className="text-right">{formatPct(p.revenueGrowth, 1, true)}</TableCell>
                    <TableCell className="text-right">{formatPct(p.netMargin)}</TableCell>
                    <TableCell className="text-right">{formatMoney(p.marketCap)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {failedPeers > 0 && <p className="mt-2 text-xs text-muted-foreground">{failedPeers} peer(s) skipped because SEC data was unavailable.</p>}
            <p className="mt-2 text-xs text-muted-foreground">Fiscal years differ between companies, so year-by-year comparisons are approximate.</p>
          </div>
        </>
      )}
    </ReportSection>
  );
}
