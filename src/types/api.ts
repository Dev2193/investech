// API request/response types matching Python FastAPI schemas

export interface PredictRequest {
  ticker: string;
  horizon_days: number;
  region: string;
}

export interface PredictResponse {
  ticker: string;
  as_of: string;
  horizon_days: number;
  p_up: number;
  exp_return_p50: number;
  exp_return_p10: number;
  exp_return_p90: number;
  confidence: number;
}

export interface ExplainRequest {
  ticker: string;
  region: string;
  as_of?: string;
  lookback_days: number;
}

export interface Article {
  url: string;
  date: string;
  region: string;
  ticker: string;
  published_at: string;
}

export interface ExplainResponse {
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

export interface TrainRequest {
  tickers?: string[];
  region: string;
}

export interface TrainResponse {
  status: string;
  trained: Record<string, string>;
}

export interface PriceData {
  date: string;
  close: number;
  ticker: string;
}

export interface NewsData {
  published_at: string;
  region: string;
  text: string;
  ticker: string;
}