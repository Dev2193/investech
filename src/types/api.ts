// API request/response types matching Python Pydantic schemas

export interface PredictRequest {
  ticker: string;
  region?: string; // defaults to "IN"
  horizon_days?: number; // defaults to 365
  as_of?: string; // ISO date string
}

export interface PredictResponse {
  ticker: string;
  as_of: string; // ISO date string
  horizon_days: number;
  p_up: number;
  exp_return_p50: number;
  exp_return_p10: number;
  exp_return_p90: number;
  confidence: number;
}

export interface ExplainRequest {
  ticker: string;
  region?: string; // defaults to "IN"
  lookback_days?: number; // defaults to 120
  as_of?: string; // ISO date string
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
  as_of: string; // ISO date string
  region: string;
  summary: string;
  articles: Record<string, any>[];
  shap_top: Record<string, any>[];
}

export interface TrainRequest {
  tickers?: string[]; // defaults to empty array
  region?: string; // defaults to "IN"
  start?: string; // ISO date string
  end?: string; // ISO date string
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