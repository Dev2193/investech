import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

interface FeatureImportanceData {
  feature: string;
  importance: number;
  impact: 'positive' | 'negative';
  description: string;
}

interface FeatureImportanceProps {
  features?: FeatureImportanceData[];
  ticker?: string;
}

export function FeatureImportance({ 
  features = [
    { feature: 'ret_20d', importance: 0.15, impact: 'positive', description: 'Monthly return trend' },
    { feature: 'vol_60d', importance: -0.12, impact: 'negative', description: 'Quarterly volatility' },
    { feature: 'sentiment_score', importance: 0.08, impact: 'positive', description: 'News sentiment' },
    { feature: 'drawdown', importance: -0.06, impact: 'negative', description: 'Maximum drawdown' },
    { feature: 'ret_250d', importance: 0.05, impact: 'positive', description: 'Annual return' },
    { feature: 'mom_12m', importance: 0.04, impact: 'positive', description: '12-month momentum' },
    { feature: 'vol_20d', importance: -0.03, impact: 'negative', description: 'Monthly volatility' },
    { feature: 'dayofweek', importance: 0.02, impact: 'positive', description: 'Day of week effect' }
  ],
  ticker = "PORTFOLIO"
}: FeatureImportanceProps) {
  const maxImportance = Math.max(...features.map(f => Math.abs(f.importance)));
  
  const getFeatureDisplayName = (feature: string) => {
    const displayNames: Record<string, string> = {
      'ret_5d': '5-Day Return',
      'ret_20d': '20-Day Return', 
      'ret_60d': '60-Day Return',
      'ret_120d': '120-Day Return',
      'ret_250d': '1-Year Return',
      'vol_5d': '5-Day Volatility',
      'vol_20d': '20-Day Volatility',
      'vol_60d': '60-Day Volatility',
      'vol_120d': '120-Day Volatility',
      'vol_250d': '1-Year Volatility',
      'drawdown': 'Max Drawdown',
      'mom_12m': '12-Month Momentum',
      'dayofweek': 'Day of Week',
      'sentiment_score': 'News Sentiment',
      'news_volume': 'News Volume'
    };
    return displayNames[feature] || feature;
  };

  const getFeatureDescription = (feature: string) => {
    const descriptions: Record<string, string> = {
      'ret_5d': 'Short-term price momentum over 5 trading days',
      'ret_20d': 'Monthly price trend over 20 trading days', 
      'ret_60d': 'Quarterly price performance over 60 trading days',
      'ret_120d': 'Semi-annual price trend over 120 trading days',
      'ret_250d': 'Annual price performance over 252 trading days',
      'vol_5d': 'Short-term price volatility and risk',
      'vol_20d': 'Monthly volatility measure',
      'vol_60d': 'Quarterly volatility and market uncertainty',
      'vol_120d': 'Semi-annual volatility pattern',
      'vol_250d': 'Annual volatility and long-term risk',
      'drawdown': 'Maximum peak-to-trough decline',
      'mom_12m': 'Long-term momentum and trend strength',
      'dayofweek': 'Day-of-week seasonal effect',
      'sentiment_score': 'Aggregated news sentiment analysis',
      'news_volume': 'Volume of news coverage and attention'
    };
    return descriptions[feature] || 'Technical indicator for model prediction';
  };

  const sortedFeatures = [...features].sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        <h2 className="text-2xl font-semibold">Feature Importance - {ticker}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Model Feature Rankings</CardTitle>
          <CardDescription>
            Features ranked by their impact on the prediction model (SHAP values)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedFeatures.map((feature, index) => {
            const percentage = Math.abs(feature.importance) / maxImportance * 100;
            const isPositive = feature.impact === 'positive';
            
            return (
              <div key={feature.feature} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {getFeatureDisplayName(feature.feature)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getFeatureDescription(feature.feature)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`${isPositive ? 'text-green-600 border-green-600' : 'text-red-600 border-red-600'}`}
                    >
                      <div className="flex items-center gap-1">
                        {isPositive ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(feature.importance).toFixed(3)}
                      </div>
                    </Badge>
                  </div>
                </div>
                
                <div className="pl-9">
                  <Progress 
                    value={percentage} 
                    className={`h-2 ${isPositive ? '[&>div]:bg-green-500' : '[&>div]:bg-red-500'}`}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Feature Categories Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Returns Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedFeatures
                .filter(f => f.feature.startsWith('ret_'))
                .slice(0, 3)
                .map(f => (
                  <div key={f.feature} className="flex justify-between text-sm">
                    <span>{getFeatureDisplayName(f.feature)}</span>
                    <span className={f.impact === 'positive' ? 'text-green-600' : 'text-red-600'}>
                      {f.importance > 0 ? '+' : ''}{f.importance.toFixed(3)}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Volatility Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedFeatures
                .filter(f => f.feature.startsWith('vol_') || f.feature === 'drawdown')
                .slice(0, 3)
                .map(f => (
                  <div key={f.feature} className="flex justify-between text-sm">
                    <span>{getFeatureDisplayName(f.feature)}</span>
                    <span className={f.impact === 'positive' ? 'text-green-600' : 'text-red-600'}>
                      {f.importance > 0 ? '+' : ''}{f.importance.toFixed(3)}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Other Factors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedFeatures
                .filter(f => !f.feature.startsWith('ret_') && !f.feature.startsWith('vol_') && f.feature !== 'drawdown')
                .slice(0, 3)
                .map(f => (
                  <div key={f.feature} className="flex justify-between text-sm">
                    <span>{getFeatureDisplayName(f.feature)}</span>
                    <span className={f.impact === 'positive' ? 'text-green-600' : 'text-red-600'}>
                      {f.importance > 0 ? '+' : ''}{f.importance.toFixed(3)}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}