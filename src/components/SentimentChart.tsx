import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react';
import { aggregateDailySignals, sentimentAnalyzer, type NewsArticle, type DailySignal } from '@/services/sentimentAnalysis';
import { useToast } from '@/hooks/use-toast';

export function SentimentChart() {
  const [signals, setSignals] = useState<DailySignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [testText, setTestText] = useState('The company reported strong quarterly earnings with revenue growth exceeding expectations.');
  const [sentiment, setSentiment] = useState<{ score: number; label: string; confidence: number } | null>(null);
  const { toast } = useToast();

  // Mock news data for demonstration
  const mockNewsData: NewsArticle[] = [
    {
      ticker: 'RELIANCE',
      published_at: '2024-01-20T10:30:00Z',
      region: 'IN',
      text: 'Reliance Industries reports strong quarterly results with significant growth in digital services and retail expansion across India.'
    },
    {
      ticker: 'RELIANCE', 
      published_at: '2024-01-20T14:15:00Z',
      region: 'IN',
      text: 'Concerns raised about increased competition in telecom sector affecting Jio subscriber growth rates.'
    },
    {
      ticker: 'RELIANCE',
      published_at: '2024-01-21T09:45:00Z', 
      region: 'IN',
      text: 'New petrochemical plant inauguration expected to boost production capacity by 25% in next fiscal year.'
    },
    {
      ticker: 'TCS',
      published_at: '2024-01-20T11:20:00Z',
      region: 'IN', 
      text: 'TCS wins major digital transformation contract worth $500M from European banking consortium.'
    },
    {
      ticker: 'TCS',
      published_at: '2024-01-21T16:30:00Z',
      region: 'IN',
      text: 'Rising attrition rates in IT sector pose challenges for maintaining project delivery timelines.'
    },
    {
      ticker: 'INFY',
      published_at: '2024-01-19T13:45:00Z',
      region: 'IN',
      text: 'Infosys announces strategic partnership with Microsoft for cloud migration services across enterprise clients.'
    }
  ];

  const generateSignals = async () => {
    setLoading(true);
    try {
      const dailySignals = await aggregateDailySignals(mockNewsData, 1.5);
      setSignals(dailySignals);
      toast({
        title: "Sentiment Analysis Complete",
        description: `Processed ${mockNewsData.length} articles into ${dailySignals.length} daily signals`
      });
    } catch (error) {
      console.error('Error generating signals:', error);
      toast({
        title: "Error",
        description: "Failed to analyze sentiment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeSingleText = async () => {
    if (!testText.trim()) return;
    
    setLoading(true);
    try {
      const result = await sentimentAnalyzer.analyzeSentiment(testText);
      setSentiment(result);
      toast({
        title: "Sentiment Analysis Complete",
        description: `Detected ${result.label} sentiment (${(result.score * 100).toFixed(1)}%)`
      });
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      toast({
        title: "Error", 
        description: "Failed to analyze text sentiment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load signals on component mount
  useEffect(() => {
    generateSignals();
  }, []);

  const formatSentiment = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.1) return 'text-green-600';
    if (score < -0.1) return 'text-red-600';
    return 'text-gray-600';
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.1) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (score < -0.1) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Sentiment Test Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Sentiment Analysis
          </CardTitle>
          <CardDescription>
            Test FinBERT sentiment analysis on financial text
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter financial text to analyze..."
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="flex-1"
            />
            <Button onClick={analyzeSingleText} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Analyze'}
            </Button>
          </div>
          
          {sentiment && (
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              {getSentimentIcon(sentiment.score)}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Sentiment:</span>
                  <Badge variant="outline" className={getSentimentColor(sentiment.score)}>
                    {sentiment.label.toUpperCase()}
                  </Badge>
                  <span className={`font-bold ${getSentimentColor(sentiment.score)}`}>
                    {formatSentiment(sentiment.score)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Confidence: {formatSentiment(sentiment.confidence)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Signals Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Daily Sentiment Signals
            </div>
            <Button variant="outline" size="sm" onClick={generateSignals} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Aggregated sentiment scores from financial news by ticker and date
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signals.length > 0 ? (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={signals}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[-1, 1]} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      formatSentiment(value), 
                      name === 'sent_mean' ? 'Sentiment' : 'Flow'
                    ]}
                  />
                  <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
                  <Line 
                    type="monotone" 
                    dataKey="sent_mean" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              
              {/* Signal Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from(new Set(signals.map(s => s.ticker))).map(ticker => {
                  const tickerSignals = signals.filter(s => s.ticker === ticker);
                  const avgSentiment = tickerSignals.reduce((sum, s) => sum + s.sent_mean, 0) / tickerSignals.length;
                  const totalFlow = tickerSignals.reduce((sum, s) => sum + s.flow, 0);
                  
                  return (
                    <div key={ticker} className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold">{ticker}</span>
                        {getSentimentIcon(avgSentiment)}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Avg Sentiment:</span>
                          <span className={getSentimentColor(avgSentiment)}>
                            {formatSentiment(avgSentiment)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Flow:</span>
                          <span>{totalFlow.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Articles:</span>
                          <span>{tickerSignals.length}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {loading ? 'Processing sentiment analysis...' : 'No sentiment data available'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}