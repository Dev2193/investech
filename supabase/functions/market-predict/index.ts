import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PredictRequest {
  ticker: string;
  horizon_days: number;
  region: string;
}

interface PredictResponse {
  ticker: string;
  as_of: string;
  horizon_days: number;
  p_up: number;
  exp_return_p50: number;
  exp_return_p10: number;
  exp_return_p90: number;
  confidence: number;
}

// Mock technical analysis and prediction logic
function generatePrediction(request: PredictRequest): PredictResponse {
  // Simulate technical analysis calculations
  const baseReturn = Math.random() * 0.2 - 0.1; // -10% to +10%
  const volatility = 0.15 + Math.random() * 0.1; // 15% to 25%
  const regionBoost = request.region === 'IN' ? 1.5 : 1.0;
  
  // Calculate probability of positive return
  const p_up = Math.max(0.1, Math.min(0.9, 0.5 + (baseReturn * regionBoost) / volatility));
  
  // Generate return distribution
  const exp_return_p50 = baseReturn * regionBoost;
  const exp_return_p10 = exp_return_p50 - 1.65 * volatility;
  const exp_return_p90 = exp_return_p50 + 1.65 * volatility;
  
  // Calculate confidence based on data quality simulation
  const confidence = Math.max(0.4, Math.min(0.9, 0.7 + Math.random() * 0.2));
  
  return {
    ticker: request.ticker,
    as_of: new Date().toISOString().split('T')[0],
    horizon_days: request.horizon_days,
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
    if (!request.ticker || !request.horizon_days || !request.region) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: ticker, horizon_days, region' }),
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