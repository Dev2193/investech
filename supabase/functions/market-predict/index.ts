import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PredictRequest {
  ticker: string;
  region?: string; // defaults to "IN"
  horizon_days?: number; // defaults to 365
  as_of?: string; // ISO date string
}

interface PredictResponse {
  ticker: string;
  as_of: string; // ISO date string
  horizon_days: number;
  p_up: number;
  exp_return_p50: number;
  exp_return_p10: number;
  exp_return_p90: number;
  confidence: number;
}

// Simulate technical feature calculation
function calculateTechnicalFeatures(ticker: string, region: string): Record<string, number> {
  // Simulate returns at different periods (like Python ret_5d, ret_20d, etc.)
  const ret_5d = (Math.random() - 0.5) * 0.1;
  const ret_20d = (Math.random() - 0.5) * 0.2;
  const ret_60d = (Math.random() - 0.5) * 0.3;
  const ret_120d = (Math.random() - 0.5) * 0.4;
  const ret_250d = (Math.random() - 0.5) * 0.5;
  
  // Simulate volatilities
  const vol_5d = 0.1 + Math.random() * 0.1;
  const vol_20d = 0.15 + Math.random() * 0.1;
  const vol_60d = 0.2 + Math.random() * 0.1;
  
  // Simulate other features
  const drawdown = -Math.random() * 0.3;
  const mom_12m = (Math.random() - 0.5) * 0.6;
  const dayofweek = Math.floor(Math.random() * 7);
  
  // Simulate sentiment features
  const sentiment_score = (Math.random() - 0.5) * 2;
  const news_volume = Math.random() * 100;
  
  return {
    ret_5d, ret_20d, ret_60d, ret_120d, ret_250d,
    vol_5d, vol_20d, vol_60d,
    drawdown, mom_12m, dayofweek,
    sentiment_score, news_volume
  };
}

// Simulate LightGBM-style prediction logic
function generatePrediction(request: PredictRequest): PredictResponse {
  // Apply Pydantic schema defaults
  const region = request.region || "IN";
  const horizonDays = request.horizon_days || 365;
  const asOf = request.as_of || new Date().toISOString().split('T')[0];
  
  const features = calculateTechnicalFeatures(request.ticker, region);
  
  // Simulate classifier prediction (direction probability)
  // Weight recent returns and sentiment more heavily
  const momentum_signal = features.ret_5d * 0.3 + features.ret_20d * 0.2 + features.sentiment_score * 0.1;
  const vol_penalty = -(features.vol_5d * 0.15 + features.vol_20d * 0.1);
  const region_boost = region === 'IN' ? 0.05 : 0.0;
  
  const raw_p_up = 0.5 + momentum_signal + vol_penalty + region_boost + (Math.random() - 0.5) * 0.1;
  const p_up = Math.max(0.05, Math.min(0.95, raw_p_up));
  
  // Simulate quantile regression predictions
  const base_vol = Math.sqrt(features.vol_20d * features.vol_60d);
  const trend_component = features.ret_20d * 0.5 + features.ret_60d * 0.3;
  
  // Median return (50th percentile)
  const exp_return_p50 = trend_component + (Math.random() - 0.5) * 0.05;
  
  // 10th and 90th percentiles with realistic spread
  const vol_multiplier = Math.max(1.0, base_vol * 10);
  const exp_return_p10 = exp_return_p50 - 1.28 * vol_multiplier; // ~10th percentile
  const exp_return_p90 = exp_return_p50 + 1.28 * vol_multiplier; // ~90th percentile
  
  // Confidence based on feature stability and data quality
  const feature_stability = 1 - Math.abs(features.vol_5d - features.vol_20d) / features.vol_20d;
  const data_quality = 0.8 + Math.random() * 0.15; // Simulate data availability
  const confidence = Math.max(0.3, Math.min(0.9, feature_stability * 0.4 + data_quality * 0.6));
  
  return {
    ticker: request.ticker,
    as_of: asOf,
    horizon_days: horizonDays,
    p_up: Math.round(p_up * 1000) / 1000,
    exp_return_p50: Math.round(exp_return_p50 * 1000) / 1000,
    exp_return_p10: Math.round(exp_return_p10 * 1000) / 1000,
    exp_return_p90: Math.round(exp_return_p90 * 1000) / 1000,
    confidence: Math.round(confidence * 1000) / 1000
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: PredictRequest = await req.json();
    
    // Validate input
    if (!request.ticker) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: ticker' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate prediction
    const prediction = generatePrediction(request);

    return new Response(JSON.stringify(prediction), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in market-predict function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});