import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TechnicalAnalysis } from './TechnicalAnalysis';
import { FeatureImportance } from './FeatureImportance';
import type { PredictResponse } from '@/types/api';

interface PredictionResultsProps {
  prediction?: PredictResponse;
}

export function PredictionResults({ 
  prediction = {
    ticker: "SAMPLE",
    as_of: new Date().toISOString().split('T')[0],
    horizon_days: 30,
    p_up: 0.68,
    exp_return_p50: 0.045,
    exp_return_p10: -0.025,
    exp_return_p90: 0.125,
    confidence: 0.73
  }
}: PredictionResultsProps) {
  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  // Mock technical features for demonstration
  const mockTechnicalFeatures = {
    ret_5d: 0.032,
    ret_20d: 0.085,
    ret_60d: -0.025,
    ret_120d: 0.145,
    ret_250d: 0.189,
    vol_5d: 0.018,
    vol_20d: 0.025,
    vol_60d: 0.032,
    vol_120d: 0.028,
    vol_250d: 0.035,
    drawdown: -0.085,
    mom_12m: 0.156,
    dayofweek: new Date().getDay()
  };

  // Mock feature importance data
  const mockFeatureImportance = [
    { feature: 'ret_20d', importance: 0.15, impact: 'positive' as const, description: 'Monthly return trend' },
    { feature: 'vol_60d', importance: -0.12, impact: 'negative' as const, description: 'Quarterly volatility' },
    { feature: 'sentiment_score', importance: 0.08, impact: 'positive' as const, description: 'News sentiment' },
    { feature: 'drawdown', importance: -0.06, impact: 'negative' as const, description: 'Maximum drawdown' },
    { feature: 'ret_250d', importance: 0.05, impact: 'positive' as const, description: 'Annual return' },
    { feature: 'mom_12m', importance: 0.04, impact: 'positive' as const, description: '12-month momentum' },
    { feature: 'vol_20d', importance: -0.03, impact: 'negative' as const, description: 'Monthly volatility' },
    { feature: 'dayofweek', importance: 0.02, impact: 'positive' as const, description: 'Day of week effect' }
  ];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Prediction Results - {prediction.ticker}</CardTitle>
          <CardDescription>
            Forecast as of {formatDate(prediction.as_of)} for {prediction.horizon_days} days ahead
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Prediction */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Direction Probability</h3>
                <div className="flex items-center gap-4">
                  <Badge 
                    variant={prediction.p_up > 0.5 ? 'default' : 'destructive'}
                    className="text-lg px-3 py-1"
                  >
                    {prediction.p_up > 0.5 ? 'UP' : 'DOWN'}
                  </Badge>
                  <span className="text-2xl font-bold">
                    {formatPercent(prediction.p_up)}
                  </span>
                </div>
                <Progress value={prediction.p_up * 100} className="mt-2" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Confidence Level</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">{formatPercent(prediction.confidence)}</span>
                  <Badge variant="outline">
                    {prediction.confidence > 0.8 ? 'High' : 
                     prediction.confidence > 0.6 ? 'Medium' : 'Low'}
                  </Badge>
                </div>
                <Progress value={prediction.confidence * 100} className="mt-2" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Expected Return Distribution</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">10th Percentile (Bear Case)</span>
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    {formatPercent(prediction.exp_return_p10)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">50th Percentile (Base Case)</span>
                  <Badge variant="outline" className={prediction.exp_return_p50 > 0 ? 'text-green-600 border-green-600' : 'text-red-600 border-red-600'}>
                    {formatPercent(prediction.exp_return_p50)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">90th Percentile (Bull Case)</span>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {formatPercent(prediction.exp_return_p90)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Analysis Section */}
      <TechnicalAnalysis ticker={prediction.ticker} features={mockTechnicalFeatures} />

      {/* Feature Importance Section */}
      <FeatureImportance features={mockFeatureImportance} ticker={prediction.ticker} />
    </div>
  );
}