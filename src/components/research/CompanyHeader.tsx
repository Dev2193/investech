import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { StockResearch } from "@/hooks/useStockResearch";
import { trailingReturn } from "@/services/research/prices";
import { formatMoney, formatPct } from "@/services/research/format";
import { SectionError } from "./SectionStatus";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function CompanyHeader({ r }: { r: StockResearch }) {
  const p = r.price.data;
  const points = p?.points.slice(-252) ?? [];
  const ret12 = p ? trailingReturn(p.points, 365) : null;
  const dayChange = p && p.points.length > 1 ? p.points[p.points.length - 1].close / p.points[p.points.length - 2].close - 1 : null;
  const name = r.company.data?.title ?? r.profile.data?.name ?? p?.name ?? r.ticker;

  return (
    <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-card to-secondary/20 p-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">{r.ticker}</h2>
            {r.sector && <Badge variant="secondary">{r.sector.name}</Badge>}
            {r.submissions.data?.exchanges?.[0] && <Badge variant="outline">{r.submissions.data.exchanges[0]}</Badge>}
          </div>
          <p className="text-lg text-muted-foreground">{name}</p>
          {r.submissions.data?.sicDescription && (
            <p className="text-sm text-muted-foreground">
              Industry (SEC SIC {r.submissions.data.sic}): {r.submissions.data.sicDescription}
            </p>
          )}
          {r.price.isLoading ? (
            <Skeleton className="h-10 w-48" />
          ) : p?.price != null ? (
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold">{formatMoney(p.price, p.currency ?? "USD")}</span>
              {dayChange !== null && (
                <span className={cn("pb-1 text-sm font-medium", dayChange >= 0 ? "text-success" : "text-destructive")}>
                  {formatPct(dayChange, 2, true)} last session
                </span>
              )}
            </div>
          ) : r.price.error ? (
            <SectionError error={r.price.error} what="price" />
          ) : null}
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span>
              Market cap: <span className="text-foreground">{formatMoney(r.marketCap ?? null)}</span>
              {r.marketCap == null && r.annual.length > 0 && " (needs Finnhub, or a current single-class SEC share count)"}
            </span>
            <span>
              12-month return: <span className={cn(ret12 !== null && (ret12 >= 0 ? "text-success" : "text-destructive"))}>{formatPct(ret12, 1, true)}</span>
            </span>
            {p?.asOf && <span>Price as of {new Date(p.asOf).toLocaleString()}</span>}
          </div>
        </div>
        <div className="h-48">
          {points.length > 1 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis domain={["auto", "auto"]} hide />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(v: number) => [formatMoney(v), "Close"]}
                />
                <Area type="monotone" dataKey="close" stroke="hsl(var(--primary))" fill="url(#priceFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Card>
  );
}
