import { AlertTriangle, KeyRound, Loader2, SearchX, TimerReset } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ResearchError } from "@/services/research/transport";

/** Loading skeleton for a section. */
export function SectionLoading({ label = "Loading data…" }: { label?: string }) {
  return (
    <div className="space-y-3" aria-busy="true">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> {label}
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

const SETUP_HINTS: Record<string, { name: string; secret: string; url: string; note: string }> = {
  finnhub: {
    name: "Finnhub",
    secret: "FINNHUB_API_KEY",
    url: "https://finnhub.io/register",
    note: "Free tier: 60 calls/minute. Powers peers, analyst ratings, company news and market cap.",
  },
  sec: {
    name: "SEC EDGAR",
    secret: "SEC_USER_AGENT",
    url: "https://www.sec.gov/os/accessing-edgar-data",
    note: 'No key needed, but SEC requires a contact User-Agent, e.g. "InvesTech.AI you@yourdomain.com".',
  },
};

/** Renders a ResearchError as a friendly, actionable message. Never falls back to fake data. */
export function SectionError({ error, what }: { error: unknown; what?: string }) {
  const e = error instanceof ResearchError ? error : null;
  if (e?.code === "missing_key") {
    const hint = SETUP_HINTS[e.source];
    return (
      <div className="rounded-lg border border-warning/40 bg-warning/5 p-4 text-sm space-y-2">
        <div className="flex items-center gap-2 font-medium text-warning">
          <KeyRound className="h-4 w-4" /> Setup needed{hint ? `: ${hint.name}` : ""}
        </div>
        <p className="text-muted-foreground">{e.message}</p>
        {hint && (
          <p className="text-muted-foreground">
            {hint.note} Set <code className="rounded bg-muted px-1 py-0.5 text-foreground">{hint.secret}</code> as an environment
            variable on the API server (locally: <code className="rounded bg-muted px-1 py-0.5 text-foreground">server/.env</code>).{" "}
            <a className="text-primary underline underline-offset-2" href={hint.url} target="_blank" rel="noreferrer">
              {hint.url.replace("https://", "")}
            </a>
          </p>
        )}
        {what && <p className="text-xs text-muted-foreground">This section ({what}) stays empty until then — no placeholder numbers are shown.</p>}
      </div>
    );
  }
  const Icon = e?.code === "rate_limited" ? TimerReset : e?.code === "not_found" ? SearchX : AlertTriangle;
  const title =
    e?.code === "rate_limited" ? "Rate limit reached" : e?.code === "not_found" ? "No data found" : "Couldn't load this data";
  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm space-y-1">
      <div className="flex items-center gap-2 font-medium text-destructive">
        <Icon className="h-4 w-4" /> {title}
      </div>
      <p className="text-muted-foreground">{(error as Error)?.message ?? "Unknown error"}</p>
    </div>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground italic">{children}</p>;
}
