import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExplainRequest {
  ticker: string;
  region: string;
  as_of?: string;
  lookback_days: number;
}

interface Article {
  url: string;
  date: string;
  region: string;
  ticker: string;
  published_at: string;
}

interface ExplainResponse {
  ticker: string;
  as_of: string;
  region: string;
  summary: string;
  articles: Article[];
  shap_top: Array<{
    feature: string;
    importance: number;
    impact: 'positive' | 'negative';
  }>;
}

function generateExplanation(request: ExplainRequest): ExplainResponse {
  // Mock SHAP feature importance
  const features = [
    { name: 'ret_20d', base: 0.15 },
    { name: 'vol_60d', base: -0.12 },
    { name: 'sentiment_score', base: 0.08 },
    { name: 'drawdown', base: -0.06 },
    { name: 'mom_12m', base: 0.05 },
    { name: 'ret_5d', base: 0.04 },
    { name: 'vol_20d', base: -0.03 }
  ];

  const shap_top = features
    .map(f => ({
      feature: f.name,
      importance: f.base + (Math.random() - 0.5) * 0.1,
      impact: (f.base > 0 ? 'positive' : 'negative') as 'positive' | 'negative'
    }))
    .sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance))
    .slice(0, 5);

  // Mock articles
  const articles: Article[] = [
    {
      url: `https://example.com/news/${request.ticker.toLowerCase()}-earnings`,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      region: request.region,
      ticker: request.ticker,
      published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      url: `https://example.com/news/${request.ticker.toLowerCase()}-expansion`,
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      region: request.region,
      ticker: request.ticker,
      published_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const summary = `Model forecast explanation for ${request.ticker} (region ${request.region}).

Recent technical analysis shows ${shap_top[0].impact === 'positive' ? 'favorable' : 'challenging'} momentum with ${shap_top[0].feature} being the primary driver (importance: ${shap_top[0].importance.toFixed(3)}).

Key technical indicators:
- 20-day returns showing ${shap_top.find(f => f.feature === 'ret_20d')?.impact === 'positive' ? 'positive' : 'negative'} momentum
- Volatility levels are ${shap_top.find(f => f.feature.includes('vol'))?.impact === 'positive' ? 'elevated' : 'stable'}
- Current drawdown status is ${shap_top.find(f => f.feature === 'drawdown')?.impact === 'positive' ? 'minimal' : 'concerning'}

Market sentiment analysis indicates ${request.region === 'IN' ? 'regional factors are weighted 1.5x due to India focus' : 'standard regional weighting applies'}. 

Risk factors to monitor include seasonal retail patterns, inflation impact on consumer spending, and regulatory changes in the ${request.region} market.`;

  return {
    ticker: request.ticker,
    as_of: request.as_of || new Date().toISOString().split('T')[0],
    region: request.region,
    summary,
    articles,
    shap_top
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: ExplainRequest = await req.json();
    
    if (!request.ticker || !request.region || !request.lookback_days) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: ticker, region, lookback_days' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const explanation = generateExplanation(request);

    return new Response(JSON.stringify(explanation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in market-explain function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});