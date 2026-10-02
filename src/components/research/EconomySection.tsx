import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import { Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StockResearch } from "@/hooks/useStockResearch";
import { GENERAL_INDICATORS } from "@/services/research/sectors";
import { ReportSection } from "./ReportSection";
import { SectionError, SectionLoading } from "./SectionStatus";
import { cn } from "@/lib/utils";

const fmt = (v: number | null, unit: string) => (v === null ? "—" : unit === "$" ? `$${v.toFixed(2)}` : unit === "%" ? `${v.toFixed(2)}%` : v.toFixed(1));

export function EconomySection({ r }: { r: StockResearch }) {
  const generalIds = new Set(GENERAL_INDICATORS.map((i) => i.id));
  const allFailed = !r.fredLoading && r.readings.length === 0 && r.fredErrors.length > 0;

  return (
    <ReportSection
      id="economy"
      icon={<Landmark className="h-5 w-5" />}
      title="Economic factors"
      description={`Macro conditions that matter for this company${r.sector ? ` and the ${r.sector.name} sector` : ""}.`}
      score={r.scores.economy}
      sources="Federal Reserve Economic Data (FRED), St. Louis Fed. Values are the latest published observations."
    >
      {r.fredLoading && r.readings.length === 0 ? (
        <SectionLoading label="Loading macro data from FRED…" />
      ) : allFailed ? (
        <SectionError error={r.fredErrors[0]} what="economic factors" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {r.readings.map((rd) => {
            const ind = rd.indicator;
            const sectorSpecific = !generalIds.has(ind.id) || (r.sector?.indicators.some((i) => i.id === ind.id) ?? false);
            const changeGood = rd.change === null || ind.goodWhenRising === 0 ? null : rd.change * ind.goodWhenRising > 0;
            return (
              <div key={ind.id} className="rounded-lg border border-border/50 bg-background/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{ind.label}</p>
                      {sectorSpecific && <Badge variant="secondary" className="text-[10px]">Sector-relevant</Badge>}
                    </div>
                    <p className="text-2xl font-semibold">{fmt(rd.current, ind.unit)}</p>
                    <p className={cn("text-xs", changeGood === null ? "text-muted-foreground" : changeGood ? "text-success" : "text-destructive")}>
                      {rd.change === null ? "No 12-month comparison" : `${rd.change >= 0 ? "+" : ""}${rd.change.toFixed(2)}${ind.unit === "%" ? " pp" : ind.unit === "$" ? " $" : ""} vs a year ago`}
                      {rd.asOf && <span className="text-muted-foreground"> · as of {rd.asOf}</span>}
                    </p>
                  </div>
                  <div className="h-12 w-28 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={rd.history.slice(-60)}>
                        <YAxis domain={["auto", "auto"]} hide />
                        <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" dot={false} strokeWidth={1.5} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{ind.relevance}</p>
                <a className="text-[11px] text-primary/80 hover:underline" href={`https://fred.stlouisfed.org/series/${ind.id}`} target="_blank" rel="noreferrer">
                  FRED: {ind.id}
                </a>
              </div>
            );
          })}
          {r.fredErrors.length > 0 && r.readings.length > 0 && (
            <p className="text-xs text-muted-foreground md:col-span-2">{r.fredErrors.length} indicator(s) could not be loaded.</p>
          )}
        </div>
      )}
    </ReportSection>
  );
}
