import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';
import { marketApi } from '@/services/marketApi';
import { useToast } from '@/hooks/use-toast';
import type { PredictRequest, PredictResponse } from '@/types/api';

export default function PredictForm() {
  const [formData, setFormData] = useState<PredictRequest>({
    ticker: '',
    region: 'IN',
    horizon_days: 365
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ticker) {
      toast({
        title: "Error",
        description: "Please enter a ticker symbol",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await marketApi.predictMock(formData);
      setResult(response);
      toast({
        title: "Prediction Complete",
        description: `Generated forecast for ${formData.ticker}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate prediction",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Market Prediction (Quant Brain)
          </CardTitle>
          <CardDescription>
            LightGBM-powered forecasting with quantile regression for return distribution modeling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="ticker">Ticker Symbol</Label>
                <Input
                  id="ticker"
                  placeholder="e.g., RELIANCE"
                  value={formData.ticker}
                  onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                />
              </div>
                <div>
                <Label htmlFor="horizon">Horizon (Days)</Label>
                <Select value={(formData.horizon_days || 365).toString()} onValueChange={(value) => setFormData({ ...formData, horizon_days: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Day</SelectItem>
                    <SelectItem value="7">1 Week</SelectItem>
                    <SelectItem value="30">1 Month</SelectItem>
                    <SelectItem value="90">3 Months</SelectItem>
                    <SelectItem value="180">6 Months</SelectItem>
                    <SelectItem value="365">1 Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="region">Region</Label>
                <Select value={formData.region || 'IN'} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN">India</SelectItem>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="EU">Europe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Generating Prediction...' : 'Generate Prediction'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Prediction Results for {result.ticker}
            </CardTitle>
            <CardDescription>
              As of {formatDate(result.as_of)} • {result.horizon_days} day horizon
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Direction Probability</span>
                  <Badge variant={result.p_up > 0.5 ? "default" : "destructive"} className="flex items-center gap-1">
                    {result.p_up > 0.5 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {result.p_up > 0.5 ? 'UP' : 'DOWN'}
                  </Badge>
                </div>
                <Progress value={result.p_up * 100} className="h-2" />
                <p className="text-sm text-muted-foreground">{formatPercentage(result.p_up)} probability of positive return</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Model Confidence</span>
                  <Badge variant="outline">{formatPercentage(result.confidence)}</Badge>
                </div>
                <Progress value={result.confidence * 100} className="h-2" />
                <p className="text-sm text-muted-foreground">Prediction reliability score</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Expected Returns</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">10th Percentile</p>
                  <p className="font-medium text-destructive">{formatPercentage(result.exp_return_p10)}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Median (50th)</p>
                  <p className="font-medium">{formatPercentage(result.exp_return_p50)}</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">90th Percentile</p>
                  <p className="font-medium text-primary">{formatPercentage(result.exp_return_p90)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}