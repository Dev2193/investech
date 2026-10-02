import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const TICKER_RE = /^[A-Za-z][A-Za-z0-9.-]{0,9}$/;

export function TickerSearch({ size = "default", initial = "", className }: { size?: "default" | "lg"; initial?: string; className?: string }) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = value.trim().toUpperCase();
    if (!TICKER_RE.test(t)) {
      setError("Enter a stock ticker like AAPL, MSFT or BRK.B");
      return;
    }
    setError(null);
    navigate(`/stock/${encodeURIComponent(t)}`);
  };

  return (
    <form onSubmit={submit} className={cn("w-full", className)} role="search">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter a ticker, e.g. AAPL"
            aria-label="Stock ticker"
            className={cn("pl-9 uppercase placeholder:normal-case", size === "lg" && "h-12 text-lg")}
            autoCapitalize="characters"
            spellCheck={false}
          />
        </div>
        <Button type="submit" className={cn(size === "lg" && "h-12 px-6 text-base")}>
          Research
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </form>
  );
}
