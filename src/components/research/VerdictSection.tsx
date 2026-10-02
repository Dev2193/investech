import { Gavel, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StockResearch } from "@/hooks/useStockResearch";
import { SECTION_LABELS, type SectionKey } from "@/services/research/analysis";
import type { ScoreFactor } from "@/services/research/types";
import { cn } from "@/lib/utils";

const VERDICT_STYLE: Record<string, string> = {
  Invest: "text-success border-success/40 bg-success/10",
  Hold: "text-warning border-warning/40 bg-warning/10",
  Avoid: "text-destructive border-destructive/40 bg-destructive/10",
  "Insufficient data": "text-muted-foreground border-border bg-muted/30",
};

export function VerdictSection({ r }: { r: StockResearch }) {
  const v = r.verdict;
  const all: (ScoreFactor & { section: string })[] = (Object.keys(r.scores) as SectionKey[]).flatMap((k) =>
    (r.scores[k]?.factors ?? []).map((f) => ({ ...f, section: SECTION_LABELS[k] })),
  );
  const pros = all.filter((f) => f.points > 0).sort((a, b) => b.points - a.points).slice(0, 5);
  const cons = all.filter((f) => f.points < 0).sort((a, b) => a.points - b.points).slice(0, 5);

  return (
    <Card id="verdict" className="scroll-mt-24 border-primary/30 bg-gradient-to-br from-card to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl">
          <span className="rounded-lg bg-primary/10 p-2 text-primary">
            <Gavel className="h-5 w-5" />
          </span>
          Conclusion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className={cn("rounded-xl border px-6 py-3 text-3xl font-bold", VERDICT_STYLE[v.label])}>{v.label}</div>
          <div className="text-sm text-muted-foreground">
            {v.composite !== null ? (
              <p>
                Composite score <span className="font-mono text-foreground">{v.composite >= 0 ? "+" : ""}{v.composite.toFixed(2)}</span> on a −2…+2 scale.
                Invest ≥ +0.50, Avoid ≤ −0.50, otherwise Hold.
              </p>
            ) : (
              <p>Fewer than half of the weighted sections have data, so no verdict is given.</p>
            )}
            <p>
              Based on {Math.round(v.coverage * 100)}% of the scoring weight{r.stillLoading ? " (some data still loading…)" : ""}.
              {v.rows.some((x) => x.score === null) && !r.stillLoading && (
                <> Not scored: {v.rows.filter((x) => x.score === null).map((x) => SECTION_LABELS[x.key]).join(", ")} — see those sections for why.</>
              )}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Section</TableHead>
                <TableHead className="text-right">Weight</TableHead>
                <TableHead className="text-right">Score (−2…+2)</TableHead>
                <TableHead className="text-right">Weighted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {v.rows.map((row) => (
                <TableRow key={row.key}>
                  <TableCell>
                    <a href={`#${row.key}`} className="hover:text-primary">
                      {SECTION_LABELS[row.key]}
                    </a>
                  </TableCell>
                  <TableCell className="text-right">{Math.round(row.weight * 100)}%</TableCell>
                  <TableCell className={cn("text-right font-mono", row.score !== null && (row.score > 0 ? "text-success" : row.score < 0 ? "text-destructive" : ""))}>
                    {row.score === null ? "no data" : `${row.score > 0 ? "+" : ""}${row.score.toFixed(2)}`}
                  </TableCell>
                  <TableCell className="text-right font-mono">{row.contribution === null ? "—" : row.contribution.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-2 text-xs text-muted-foreground">Composite = sum of weighted scores ÷ total weight of sections that have data.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="mb-2 font-semibold text-success">Main reasons for</h4>
            {pros.length ? (
              <ul className="space-y-1 text-sm">
                {pros.map((f) => (
                  <li key={f.section + f.label}>
                    <span className="font-mono text-success">+{f.points.toFixed(2)}</span> {f.label} <span className="text-muted-foreground">({f.section}: {f.detail})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">None found.</p>
            )}
          </div>
          <div>
            <h4 className="mb-2 font-semibold text-destructive">Main reasons against</h4>
            {cons.length ? (
              <ul className="space-y-1 text-sm">
                {cons.map((f) => (
                  <li key={f.section + f.label}>
                    <span className="font-mono text-destructive">{f.points.toFixed(2)}</span> {f.label} <span className="text-muted-foreground">({f.section}: {f.detail})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">None found.</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 rounded-lg border border-warning/40 bg-warning/5 p-4 text-sm">
          <ShieldAlert className="h-5 w-5 shrink-0 text-warning" />
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">Not financial advice.</span> This verdict is produced mechanically by simple, published rules from
            public data that may be delayed, incomplete or wrong. It does not consider your goals, risk tolerance or valuation in depth. Do your own research
            and consider speaking with a licensed financial adviser before investing.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
