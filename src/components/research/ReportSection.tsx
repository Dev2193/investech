import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SectionScore } from "@/services/research/types";

export function ScoreBadge({ score }: { score: SectionScore | undefined }) {
  if (!score || score.score === null) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Not scored
      </Badge>
    );
  }
  const s = score.score;
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono",
        s > 0.25 && "border-success/50 text-success",
        s < -0.25 && "border-destructive/50 text-destructive",
        s >= -0.25 && s <= 0.25 && "border-warning/50 text-warning",
      )}
      title="Section score on a −2 … +2 scale"
    >
      {s > 0 ? "+" : ""}
      {s.toFixed(2)} · {score.summary}
    </Badge>
  );
}

interface ReportSectionProps {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  score?: SectionScore;
  sources: string;
  children: ReactNode;
}

export function ReportSection({ id, icon, title, description, score, sources, children }: ReportSectionProps) {
  return (
    <Card id={id} className="scroll-mt-24 bg-gradient-to-br from-card to-secondary/20 border-border/50">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <ScoreBadge score={score} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {children}
        {score && score.factors.length > 0 && (
          <div className="rounded-lg border border-border/60 bg-background/40 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">How this section was scored</p>
            <ul className="space-y-1 text-sm">
              {score.factors.map((f) => (
                <li key={f.label} className="flex items-start justify-between gap-4">
                  <span>
                    <span className="text-foreground">{f.label}</span>
                    <span className="text-muted-foreground"> — {f.detail}</span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-mono",
                      f.points > 0 ? "text-success" : f.points < 0 ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {f.points > 0 ? "+" : ""}
                    {f.points.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Sources: {sources}</p>
      </CardContent>
    </Card>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "pos" | "neg" }) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-semibold", tone === "pos" && "text-success", tone === "neg" && "text-destructive")}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
