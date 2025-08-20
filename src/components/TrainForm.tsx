import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Settings2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { marketApi } from '@/services/marketApi';
import { useToast } from '@/hooks/use-toast';
import type { TrainRequest, TrainResponse } from '@/types/api';

export default function TrainForm() {
  const [formData, setFormData] = useState<TrainRequest>({
    tickers: [],
    region: 'IN'
  });
  const [tickerInput, setTickerInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrainResponse | null>(null);
  const { toast } = useToast();

  const addTicker = () => {
    if (tickerInput.trim() && !formData.tickers?.includes(tickerInput.trim().toUpperCase())) {
      setFormData({
        ...formData,
        tickers: [...(formData.tickers || []), tickerInput.trim().toUpperCase()]
      });
      setTickerInput('');
    }
  };

  const removeTicker = (ticker: string) => {
    setFormData({
      ...formData,
      tickers: formData.tickers?.filter(t => t !== ticker) || []
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tickers?.length) {
      toast({
        title: "Error",
        description: "Please add at least one ticker to train",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await marketApi.trainMock(formData);
      setResult(response);
      toast({
        title: "Training Complete",
        description: `Successfully trained models for ${formData.tickers.length} ticker(s)`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to train models",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTicker();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Model Training
          </CardTitle>
          <CardDescription>
            Train machine learning models for specific tickers using historical price and sentiment data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="region">Training Region</Label>
                <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
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

              <div className="space-y-3">
                <Label htmlFor="ticker-input">Ticker Symbols</Label>
                <div className="flex gap-2">
                  <Input
                    id="ticker-input"
                    placeholder="Enter ticker (e.g., RELIANCE)"
                    value={tickerInput}
                    onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                    onKeyPress={handleKeyPress}
                  />
                  <Button type="button" onClick={addTicker} variant="outline">
                    Add
                  </Button>
                </div>
                
                {formData.tickers && formData.tickers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.tickers.map((ticker) => (
                      <Badge key={ticker} variant="secondary" className="flex items-center gap-1">
                        {ticker}
                        <button
                          type="button"
                          onClick={() => removeTicker(ticker)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading || !formData.tickers?.length} 
              className="w-full"
            >
              {loading ? 'Training Models...' : `Train ${formData.tickers?.length || 0} Model(s)`}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardHeader>
            <CardTitle>Training Progress</CardTitle>
            <CardDescription>
              Training models for {formData.tickers?.length} ticker(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={undefined} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Processing historical data and training ML models...
            </p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Training Results
            </CardTitle>
            <CardDescription>
              Status: {result.status}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {Object.entries(result.trained).map(([ticker, status]) => (
                <div key={ticker} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">{ticker}</span>
                  <Badge variant={status === 'trained' ? 'default' : 'destructive'} className="flex items-center gap-1">
                    {status === 'trained' ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    {status}
                  </Badge>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Models are now ready for prediction and explanation requests.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}