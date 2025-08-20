import { supabase } from '@/integrations/supabase/client';
import { aggregateDailySignals, type NewsArticle } from '@/services/sentimentAnalysis';
import type { PredictRequest, PredictResponse, ExplainRequest, ExplainResponse, TrainRequest, TrainResponse } from '@/types/api';

const SUPABASE_EDGE_FUNCTION_URL = 'https://psfvdenzdudcxmxwjapx.supabase.co/functions/v1';

export class MarketAPI {
  private async callEdgeFunction<T>(functionName: string, payload: any): Promise<T> {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload
    });

    if (error) {
      throw new Error(`API Error: ${error.message}`);
    }

    return data;
  }

  async predict(request: PredictRequest): Promise<PredictResponse> {
    try {
      return await this.callEdgeFunction<PredictResponse>('market-predict', request);
    } catch (error) {
      console.warn('Edge function not available, using mock data:', error);
      return this.predictMock(request);
    }
  }

  async explain(request: ExplainRequest): Promise<ExplainResponse> {
    try {
      return await this.callEdgeFunction<ExplainResponse>('market-explain', request);
    } catch (error) {
      console.warn('Edge function not available, using mock data:', error);
      return this.explainMock(request);
    }
  }

  async train(request: TrainRequest): Promise<TrainResponse> {
    try {
      return await this.callEdgeFunction<TrainResponse>('market-train', request);
    } catch (error) {
      console.warn('Edge function not available, using mock data:', error);
      return this.trainMock(request);
    }
  }

  // Mock implementation for development
  async predictMock(request: PredictRequest): Promise<PredictResponse> {
    // Apply defaults matching Pydantic schema
    const region = request.region || "IN";
    const horizonDays = request.horizon_days || 365;
    const asOf = request.as_of || new Date().toISOString().split('T')[0];
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      ticker: request.ticker,
      as_of: asOf,
      horizon_days: horizonDays,
      p_up: 0.65,
      exp_return_p50: 0.08,
      exp_return_p10: -0.05,
      exp_return_p90: 0.22,
      confidence: 0.73
    };
  }

  async explainMock(request: ExplainRequest): Promise<ExplainResponse> {
    // Apply defaults matching Pydantic schema
    const region = request.region || "IN";
    const lookbackDays = request.lookback_days || 120;
    const asOf = request.as_of || new Date().toISOString().split('T')[0];
    
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Mock news data for sentiment analysis
    const mockNewsData: NewsArticle[] = [
      {
        ticker: request.ticker,
        published_at: '2024-01-20T10:30:00Z',
        region: region,
        text: `${request.ticker} reports strong quarterly results with significant growth in digital services and retail expansion.`
      },
      {
        ticker: request.ticker,
        published_at: '2024-01-19T14:15:00Z',
        region: region,
        text: `Market concerns about increased competition in the sector affecting ${request.ticker} growth prospects.`
      },
      {
        ticker: request.ticker,
        published_at: '2024-01-18T09:45:00Z',
        region: region,
        text: `${request.ticker} announces new strategic initiatives expected to boost revenue by 15% next quarter.`
      }
    ];

    try {
      // Use real sentiment analysis
      const sentimentSignals = await aggregateDailySignals(mockNewsData, region === 'IN' ? 1.5 : 1.0);
      const avgSentiment = sentimentSignals.length > 0 
        ? sentimentSignals.reduce((sum, s) => sum + s.sent_mean, 0) / sentimentSignals.length 
        : 0;

      const summary = `Model forecast explanation for ${request.ticker} (region ${region}). ` +
        `Sentiment analysis shows ${avgSentiment > 0 ? 'positive' : avgSentiment < 0 ? 'negative' : 'neutral'} market sentiment ` +
        `with average score of ${(avgSentiment * 100).toFixed(1)}%. Recent technical indicators show momentum patterns ` +
        `based on ${sentimentSignals.length} daily signal aggregates over ${lookbackDays} day lookback period. ` +
        `Key drivers include earnings expectations, sector rotation patterns, and regional market dynamics specific to ${region}.`;

      return {
        ticker: request.ticker,
        as_of: asOf,
        region: region,
        summary,
        articles: mockNewsData.map(article => ({
          url: "https://example.com/news",
          date: article.published_at.split('T')[0],
          region: article.region,
          ticker: article.ticker,
          published_at: article.published_at
        })),
        shap_top: [
          { feature: "ret_20d", importance: 0.15, impact: "positive" },
          { feature: "vol_60d", importance: -0.12, impact: "negative" },
          { feature: "sentiment_score", importance: avgSentiment > 0 ? 0.08 : -0.05, impact: avgSentiment > 0 ? "positive" : "negative" },
          { feature: "drawdown", importance: -0.06, impact: "negative" }
        ]
      };
    } catch (error) {
      console.error('Error in sentiment analysis:', error);
      // Fallback to original mock response
      return {
        ticker: request.ticker,
        as_of: asOf,
        region: region,
        summary: `Model forecast explanation for ${request.ticker} (region ${region}). Technical analysis indicates mixed signals with moderate confidence levels over ${lookbackDays} day period.`,
        articles: mockNewsData.map(article => ({
          url: "https://example.com/news",
          date: article.published_at.split('T')[0],
          region: article.region,
          ticker: article.ticker,
          published_at: article.published_at
        })),
        shap_top: [
          { feature: "ret_20d", importance: 0.15, impact: "positive" },
          { feature: "vol_60d", importance: -0.12, impact: "negative" },
          { feature: "sentiment_score", importance: 0.08, impact: "positive" },
          { feature: "drawdown", importance: -0.06, impact: "negative" }
        ]
      };
    }
  }

  async trainMock(request: TrainRequest): Promise<TrainResponse> {
    // Apply defaults matching Pydantic schema
    const tickers = request.tickers || [];
    const region = request.region || "IN";
    const start = request.start;
    const end = request.end;
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const trained: Record<string, string> = {};
    tickers.forEach(ticker => {
      trained[ticker] = "trained";
    });

    console.log(`Training completed for region ${region}${start ? ` from ${start}` : ''}${end ? ` to ${end}` : ''}`);

    return {
      status: "ok",
      trained
    };
  }
}

export const marketApi = new MarketAPI();