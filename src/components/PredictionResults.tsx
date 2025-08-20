import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const mockPredictions = [
  { ticker: 'AAPL', probability: 0.78, prediction: 'UP', confidence: 'High' },
  { ticker: 'GOOGL', probability: 0.65, prediction: 'UP', confidence: 'Medium' },
  { ticker: 'TSLA', probability: 0.42, prediction: 'DOWN', confidence: 'Medium' },
  { ticker: 'MSFT', probability: 0.71, prediction: 'UP', confidence: 'High' },
  { ticker: 'NVDA', probability: 0.38, prediction: 'DOWN', confidence: 'Low' },
];

export function PredictionResults() {
  return (
    <Card className="p-6 bg-gradient-to-br from-card to-secondary/20 border-border/50">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Model Predictions</h3>
        
        <div className="space-y-4">
          {mockPredictions.map((pred) => (
            <div key={pred.ticker} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/30">
              <div className="flex items-center space-x-4">
                <div className="font-mono font-bold text-foreground">{pred.ticker}</div>
                <Badge 
                  variant={pred.prediction === 'UP' ? 'default' : 'destructive'}
                  className={pred.prediction === 'UP' ? 'bg-success text-success-foreground' : ''}
                >
                  {pred.prediction}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">
                    {(pred.probability * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">{pred.confidence}</div>
                </div>
                <div className="w-20">
                  <Progress 
                    value={pred.probability * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}