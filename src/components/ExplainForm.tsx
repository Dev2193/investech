import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Brain, ExternalLink, Calendar, FileText } from 'lucide-react';
import { marketApi } from '@/services/marketApi';
import { useToast } from '@/hooks/use-toast';
import type { ExplainRequest, ExplainResponse } from '@/types/api';

export default function ExplainForm() {
  const [formData, setFormData] = useState<ExplainRequest>({
    ticker: '',
    region: 'IN',
    lookback_days: 120
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExplainResponse | null>(null);
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
      const response = await marketApi.explainMock(formData);
      setResult(response);
      toast({
        title: "Analysis Complete",
        description: `Generated explanation for ${formData.ticker}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate explanation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
            <Brain className="h-5 w-5" />
            Model Explanation
          </CardTitle>
          <CardDescription>
            Get detailed explanations of model predictions with SHAP feature importance and relevant news articles
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
                <Label htmlFor="region">Region</Label>
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
              <div>
                <Label htmlFor="lookback">Lookback Days</Label>
                <Select value={formData.lookback_days.toString()} onValueChange={(value) => setFormData({ ...formData, lookback_days: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="60">60 Days</SelectItem>
                    <SelectItem value="120">120 Days</SelectItem>
                    <SelectItem value="180">180 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Generating Explanation...' : 'Generate Explanation'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Analysis Summary for {result.ticker}
              </CardTitle>
              <CardDescription>
                As of {formatDate(result.as_of)} • Region: {result.region}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{result.summary}</p>
            </CardContent>
          </Card>

          {result.shap_top.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>SHAP Feature Importance</CardTitle>
                <CardDescription>
                  Top features driving the model prediction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.shap_top.map((feature, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={feature.impact === 'positive' ? 'default' : 'destructive'}>
                        {feature.impact === 'positive' ? '+' : '-'}
                      </Badge>
                      <span className="font-medium">{feature.feature}</span>
                    </div>
                    <span className="text-sm font-mono">
                      {feature.importance > 0 ? '+' : ''}{feature.importance.toFixed(3)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {result.articles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Relevant Articles</CardTitle>
                <CardDescription>
                  News articles retrieved from vector search
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.articles.map((article, index) => (
                  <div key={index}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {formatDate(article.published_at)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {article.region}
                          </Badge>
                        </div>
                        <a 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Article
                        </a>
                      </div>
                    </div>
                    {index < result.articles.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}