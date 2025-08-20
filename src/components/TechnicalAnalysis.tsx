import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react";
import { addTechnicalFeatures, PriceData } from "@/utils/technicalAnalysis";

// Mock price data for demonstration
const mockPriceData: PriceData[] = [
  { date: '2024-01-01', close: 100, ticker: 'AAPL' },
  { date: '2024-01-02', close: 102, ticker: 'AAPL' },
  { date: '2024-01-03', close: 98, ticker: 'AAPL' },
  { date: '2024-01-04', close: 105, ticker: 'AAPL' },
  { date: '2024-01-05', close: 103, ticker: 'AAPL' },
  { date: '2024-01-08', close: 107, ticker: 'AAPL' },
  { date: '2024-01-09', close: 109, ticker: 'AAPL' },
  { date: '2024-01-10', close: 108, ticker: 'AAPL' },
  { date: '2024-01-11', close: 112, ticker: 'AAPL' },
  { date: '2024-01-12', close: 115, ticker: 'AAPL' },
  { date: '2024-01-15', close: 118, ticker: 'AAPL' },
  { date: '2024-01-16', close: 116, ticker: 'AAPL' },
  { date: '2024-01-17', close: 120, ticker: 'AAPL' },
  { date: '2024-01-18', close: 122, ticker: 'AAPL' },
  { date: '2024-01-19', close: 119, ticker: 'AAPL' },
  { date: '2024-01-22', close: 125, ticker: 'AAPL' },
  { date: '2024-01-23', close: 128, ticker: 'AAPL' },
];

export function TechnicalAnalysis() {
  const technicalData = addTechnicalFeatures(mockPriceData);
  const latestData = technicalData[technicalData.length - 1];

  const formatPercentage = (value: number) => `${(value * 100).toFixed(2)}%`;
  const formatDrawdown = (value: number) => `${(value * 100).toFixed(2)}%`;

  const getReturnColor = (value: number) => {
    if (value > 0.05) return "text-success";
    if (value < -0.05) return "text-destructive";
    return "text-muted-foreground";
  };

  const getVolatilityLevel = (value: number) => {
    if (value > 0.3) return { level: "High", color: "destructive" };
    if (value > 0.15) return { level: "Medium", color: "warning" };
    return { level: "Low", color: "success" };
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-secondary/20 border-border/50">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Technical Analysis Features</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {latestData?.ticker || 'AAPL'}
          </Badge>
        </div>

        {/* Returns Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Period Returns</span>
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { period: '5d', value: latestData?.ret_5d || 0 },
              { period: '20d', value: latestData?.ret_20d || 0 },
              { period: '60d', value: latestData?.ret_60d || 0 },
              { period: '120d', value: latestData?.ret_120d || 0 },
              { period: '250d', value: latestData?.ret_250d || 0 },
            ].map(({ period, value }) => (
              <div key={period} className="bg-secondary/30 rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground mb-1">{period}</div>
                <div className={`text-sm font-medium ${getReturnColor(value)}`}>
                  {formatPercentage(value)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Volatility Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Volatility</span>
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { period: '5d', value: latestData?.vol_5d || 0 },
              { period: '20d', value: latestData?.vol_20d || 0 },
              { period: '60d', value: latestData?.vol_60d || 0 },
              { period: '120d', value: latestData?.vol_120d || 0 },
              { period: '250d', value: latestData?.vol_250d || 0 },
            ].map(({ period, value }) => {
              const volLevel = getVolatilityLevel(value);
              return (
                <div key={period} className="bg-secondary/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">{period}</div>
                  <div className="text-sm font-medium text-foreground mb-1">
                    {formatPercentage(value)}
                  </div>
                  <Badge variant="outline" className={`text-xs h-5 text-${volLevel.color}`}>
                    {volLevel.level}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-secondary/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Drawdown</span>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <div className="text-lg font-semibold text-destructive">
              {formatDrawdown(latestData?.drawdown || 0)}
            </div>
            <Progress 
              value={Math.abs((latestData?.drawdown || 0) * 100)} 
              className="mt-2 h-2"
            />
          </div>

          <div className="bg-secondary/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">12M Momentum</span>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className={`text-lg font-semibold ${getReturnColor(latestData?.mom_12m || 0)}`}>
              {formatPercentage(latestData?.mom_12m || 0)}
            </div>
          </div>

          <div className="bg-secondary/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Day of Week</span>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div className="text-lg font-semibold text-foreground">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][latestData?.dayofweek || 0]}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}