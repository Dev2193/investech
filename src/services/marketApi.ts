import { supabase } from '@/integrations/supabase/client';
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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      ticker: request.ticker,
      as_of: new Date().toISOString().split('T')[0],
      horizon_days: request.horizon_days,
      p_up: 0.65,
      exp_return_p50: 0.08,
      exp_return_p10: -0.05,
      exp_return_p90: 0.22,
      confidence: 0.73
    };
  }

  async explainMock(request: ExplainRequest): Promise<ExplainResponse> {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return {
      ticker: request.ticker,
      as_of: request.as_of || new Date().toISOString().split('T')[0],
      region: request.region,
      summary: `Model forecast explanation for ${request.ticker} (region ${request.region}). Recent technical indicators show strong momentum with 5-day returns at +3.2%. Sentiment analysis of recent news articles indicates positive market sentiment driven by expansion announcements and strong quarterly results. Key risk factors include seasonal retail patterns and potential inflation impact on consumer spending.`,
      articles: [
        {
          url: "https://example.com/news1",
          date: "2024-01-15",
          region: request.region,
          ticker: request.ticker,
          published_at: "2024-01-15T10:30:00Z"
        },
        {
          url: "https://example.com/news2", 
          date: "2024-01-14",
          region: request.region,
          ticker: request.ticker,
          published_at: "2024-01-14T14:15:00Z"
        }
      ],
      shap_top: [
        { feature: "ret_20d", importance: 0.15, impact: "positive" },
        { feature: "vol_60d", importance: -0.12, impact: "negative" },
        { feature: "sentiment_score", importance: 0.08, impact: "positive" },
        { feature: "drawdown", importance: -0.06, impact: "negative" }
      ]
    };
  }

  async trainMock(request: TrainRequest): Promise<TrainResponse> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const trained: Record<string, string> = {};
    request.tickers?.forEach(ticker => {
      trained[ticker] = "trained";
    });

    return {
      status: "ok",
      trained
    };
  }
}

export const marketApi = new MarketAPI();