import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  description?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon,
  description 
}: MetricCardProps) {
  return (
    <Card className="p-6 bg-gradient-to-br from-card to-secondary/20 border-border/50 hover:border-primary/30 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-foreground">{value}</span>
            {change && (
              <span
                className={cn(
                  "text-sm font-medium",
                  changeType === 'positive' && "text-success",
                  changeType === 'negative' && "text-destructive",
                  changeType === 'neutral' && "text-muted-foreground"
                )}
              >
                {change}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {icon && (
          <div className="text-primary/60">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}