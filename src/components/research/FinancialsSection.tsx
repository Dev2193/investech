import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StockResearch } from "@/hooks/useStockResearch";
import { formatMoney, formatNumber, formatPct } from "@/services/research/format";
import { toneOf } from "@/services/research/format";
import { growth } from "@/services/research/analysis";
import { ReportSection, Stat } from "./ReportSection";
import { EmptyNote, SectionError, SectionLoading } from "./SectionStatus";

const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 };

export function FinancialsSection({ r }: { r: StockResearch }) {
  const y = r.annual;
  const cur = y[y.length - 1];
  const k = r.ratios;
  const loading = r.company.isLoading || r.facts.isLoading;
  const error = r.company.error || r.facts.error;

  const chart = y.map((a) => ({
    year: `FY${a.fiscalYear}`,
    Revenue: a.revenue,
    "Net income": a.netIncome,
    "Free cash flow": a.freeCashFlow,
  }));

  return (
    <ReportSection
      id="financials"
      icon={<BarChart3 className="h-5 w-5" />}
      title="Company financials"
      description="Annual results from the company's 10-K filings, with key ratios and year-over-year growth."
      score={r.scores.financials}
      sources="SEC EDGAR XBRL company facts (10-K annual data, as reported); price from Yahoo Finance for P/E and market cap."
    >
      {loading ? (
        <SectionLoading label="Loading SEC filings…" />
      ) : error ? (
        <SectionError error={error} what="financials" />
      ) : !cur ? (
        <EmptyNote>SEC EDGAR has no annual XBRL financial statements for this registrant (e.g. foreign filers, funds, or recently reorganized holding companies).</EmptyNote>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Latest fiscal year: FY{cur.fiscalYear} (ended {cur.periodEnd}).
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Revenue" value={formatMoney(cur.revenue)} hint={`${formatPct(k.revenueGrowth, 1, true)} YoY`} tone={toneOf(k.revenueGrowth)} />
            <Stat label="Net income" value={formatMoney(cur.netIncome)} hint={`${formatPct(k.netIncomeGrowth, 1, true)} YoY`} tone={toneOf(cur.netIncome)} />
            <Stat label="Diluted EPS" value={cur.epsDiluted !== null ? `$${cur.epsDiluted.toFixed(2)}` : "—"} hint={`${formatPct(k.epsGrowth, 1, true)} YoY`} tone={toneOf(k.epsGrowth)} />
            <Stat label="P/E (on last FY EPS)" value={formatNumber(k.peRatio, 1, "x")} />
            <Stat label="Gross margin" value={formatPct(k.grossMargin)} />
            <Stat label="Operating margin" value={formatPct(k.operatingMargin)} tone={toneOf(k.operatingMargin)} />
            <Stat label="Net margin" value={formatPct(k.netMargin)} tone={toneOf(k.netMargin)} />
            <Stat label="Return on equity" value={formatPct(k.returnOnEquity)} />
            <Stat label="Cash & equivalents" value={formatMoney(cur.cash)} />
            <Stat label="Total debt" value={formatMoney(cur.totalDebt)} hint="Long-term + current debt" />
            <Stat label="Net cash (cash − debt)" value={formatMoney(k.netCash)} tone={toneOf(k.netCash)} />
            <Stat label="Debt / equity" value={formatNumber(k.debtToEquity, 2, "x")} />
            <Stat label="Current ratio" value={formatNumber(k.currentRatio, 2, "x")} />
            <Stat label="Free cash flow" value={formatMoney(cur.freeCashFlow)} hint={`${formatPct(k.fcfMargin)} of revenue`} tone={toneOf(cur.freeCashFlow)} />
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => formatMoney(v)} width={70} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatMoney(v)} />
                <Legend />
                <Bar dataKey="Revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Net income" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Free cash flow" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fiscal year</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">YoY</TableHead>
                  <TableHead className="text-right">Net income</TableHead>
                  <TableHead className="text-right">Net margin</TableHead>
                  <TableHead className="text-right">EPS (dil.)</TableHead>
                  <TableHead className="text-right">Cash</TableHead>
                  <TableHead className="text-right">Debt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...y].reverse().map((a) => {
                  const prev = y[y.indexOf(a) - 1];
                  const g = prev ? growth(a.revenue, prev.revenue) : null;
                  return (
                    <TableRow key={a.periodEnd}>
                      <TableCell>FY{a.fiscalYear}</TableCell>
                      <TableCell className="text-right">{formatMoney(a.revenue)}</TableCell>
                      <TableCell className={`text-right ${g !== null ? (g >= 0 ? "text-success" : "text-destructive") : ""}`}>{formatPct(g, 1, true)}</TableCell>
                      <TableCell className="text-right">{formatMoney(a.netIncome)}</TableCell>
                      <TableCell className="text-right">{formatPct(a.revenue && a.netIncome !== null ? a.netIncome / a.revenue : null)}</TableCell>
                      <TableCell className="text-right">{a.epsDiluted !== null ? a.epsDiluted.toFixed(2) : "—"}</TableCell>
                      <TableCell className="text-right">{formatMoney(a.cash)}</TableCell>
                      <TableCell className="text-right">{formatMoney(a.totalDebt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <p className="mt-2 text-xs text-muted-foreground">
              EPS is as reported in each filing and is not adjusted for later stock splits. "—" means the company did not report that line item in a standard XBRL tag.
            </p>
          </div>
        </>
      )}
    </ReportSection>
  );
}
