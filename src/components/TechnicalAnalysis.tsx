import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Calendar } from 'lucide-react';

interface TechnicalFeatures {
  ret_5d: number;
  ret_20d: number;
  ret_60d: number;
  ret_120d: number;
  ret_250d: number;
  vol_5d: number;
  vol_20d: number;
  vol_60d: number;
  vol_120d: number;
  vol_250d: number;
  drawdown: number;
  mom_12m: number;
  dayofweek: number;
}

interface TechnicalAnalysisProps {
  ticker?: string;
  features?: TechnicalFeatures;
}

export function TechnicalAnalysis({ 
  ticker = "PORTFOLIO", 
  features = {
    ret_5d: 0.015,
    ret_20d: 0.042,
    ret_60d: -0.018,
    ret_120d: 0.089,
    ret_250d: 0.124,
    vol_5d: 0.012,
    vol_20d: 0.018,
    vol_60d: 0.024,
    vol_120d: 0.021,
    vol_250d: 0.026,
    drawdown: -0.065,
    mom_12m: 0.098,
    dayofweek: new Date().getDay()
  }
}: TechnicalAnalysisProps) {
  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;
  
  const getReturnColor = (value: number) => {
    if (value > 0.05) return 'text-green-600';
    if (value > 0) return 'text-green-500';
    if (value < -0.05) return 'text-red-600';
    return 'text-red-500';
  };

  const getDayName = (dayNum: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum] || 'Unknown';
  };

  const returnPeriods = [
    { period: '5d', value: features.ret_5d, label: '5 Day Return' },
    { period: '20d', value: features.ret_20d, label: '20 Day Return' },
    { period: '60d', value: features.ret_60d, label: '60 Day Return' },
    { period: '120d', value: features.ret_120d, label: '120 Day Return' },
    { period: '250d', value: features.ret_250d, label: '1 Year Return' },
  ];

  const volatilityPeriods = [
    { period: '5d', value: features.vol_5d, label: '5 Day Volatility' },
    { period: '20d', value: features.vol_20d, label: '20 Day Volatility' },
    { period: '60d', value: features.vol_60d, label: '60 Day Volatility' },
    { period: '120d', value: features.vol_120d, label: '120 Day Volatility' },
    { period: '250d', value: features.vol_250d, label: '1 Year Volatility' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5" />
        <h2 className="text-2xl font-semibold">Technical Analysis - {ticker}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Returns Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Returns
            </CardTitle>
            <CardDescription>Price returns across different periods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {returnPeriods.map(({ period, value, label }) => (
              <div key={period} className="flex justify-between items-center">
                <span className="text-sm font-medium">{label}</span>
                <Badge 
                  variant="outline" 
                  className={`${getReturnColor(value)} border-current`}
                >
                  {formatPercent(value)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Volatility Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Volatility
            </CardTitle>
            <CardDescription>Price volatility across different periods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {volatilityPeriods.map(({ period, value, label }) => (
              <div key={period} className="flex justify-between items-center">
                <span className="text-sm font-medium">{label}</span>
                <Badge variant="outline">
                  {formatPercent(value)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Risk Metrics Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Risk Metrics
            </CardTitle>
            <CardDescription>Drawdown and momentum indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Max Drawdown</span>
              <Badge 
                variant="outline" 
                className={`${features.drawdown < -0.1 ? 'text-red-600 border-red-600' : 'text-orange-500 border-orange-500'}`}
              >
                {formatPercent(features.drawdown)}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">12M Momentum</span>
              <Badge 
                variant="outline" 
                className={`${getReturnColor(features.mom_12m)} border-current`}
              >
                {formatPercent(features.mom_12m)}
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Day of Week
              </span>
              <Badge variant="outline">
                {getDayName(features.dayofweek)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Summary</CardTitle>
          <CardDescription>Key technical indicators for model input</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-lg text-primary">
                {returnPeriods.filter(r => r.value > 0).length}/5
              </div>
              <div className="text-muted-foreground">Positive Returns</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-primary">
                {formatPercent(Math.max(...volatilityPeriods.map(v => v.value)))}
              </div>
              <div className="text-muted-foreground">Max Volatility</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-primary">
                {formatPercent(features.ret_250d)}
              </div>
              <div className="text-muted-foreground">Annual Return</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-primary">
                {Math.abs(features.drawdown) > 0.2 ? 'High' : Math.abs(features.drawdown) > 0.1 ? 'Medium' : 'Low'}
              </div>
              <div className="text-muted-foreground">Risk Level</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-primary">
                {features.mom_12m > 0 ? 'Bullish' : 'Bearish'}
              </div>
              <div className="text-muted-foreground">Momentum</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg text-primary">
                {features.dayofweek}
              </div>
              <div className="text-muted-foreground">Day Index</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}