import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LineChart, MessageCircle } from "lucide-react";
import { TickerSearch } from "@/components/research/TickerSearch";
import { cn } from "@/lib/utils";

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
  );

export function AppLayout() {
  const { pathname } = useLocation();
  const showHeaderSearch = pathname.startsWith("/stock/");
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur">
        <div className="container mx-auto flex flex-wrap items-center gap-4 py-3">
          <NavLink to="/" className="text-xl font-bold tracking-tight">
            InvesTech<span className="text-primary">.AI</span>
          </NavLink>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navClass}>
              <LineChart className="h-4 w-4" /> Research
            </NavLink>
            <NavLink to="/assistant" className={navClass}>
              <MessageCircle className="h-4 w-4" /> AI Assistant
            </NavLink>
          </nav>
          {showHeaderSearch && <TickerSearch key={pathname} className="ml-auto max-w-sm" />}
        </div>
      </header>
      <main className="container mx-auto py-8">
        <Outlet />
      </main>
      <footer className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
        InvesTech.AI is for educational and informational purposes only and is not financial advice.
      </footer>
    </div>
  );
}
