import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrainRequest {
  tickers?: string[]; // defaults to empty array
  region?: string; // defaults to "IN"
  start?: string; // ISO date string
  end?: string; // ISO date string
}

interface TrainResponse {
  status: string;
  trained: Record<string, string>;
}

// Simulate LightGBM model training process
function simulateTraining(request: TrainRequest): TrainResponse {
  // Apply Pydantic schema defaults
  const tickers = request.tickers || [];
  const region = request.region || "IN";
  const start = request.start;
  const end = request.end;
  
  const trained: Record<string, string> = {};
  
  // Simulate training process for each ticker
  tickers.forEach(ticker => {
    // Simulate model training steps like the Python code
    console.log(`Training models for ${ticker} in region ${region}:`);
    console.log(`- Building feature datasets with technical indicators`);
    console.log(`- Training LGBMClassifier for direction prediction`);
    console.log(`- Training quantile regressors (p10, p50, p90)`);
    console.log(`- Cross-validating with TimeSeriesSplit`);
    if (start) console.log(`- Training period starts: ${start}`);
    if (end) console.log(`- Training period ends: ${end}`);
    
    // Simulate training success based on data quality
    const dataQuality = 0.7 + Math.random() * 0.25; // 70-95% data quality
    const hasEnoughData = Math.random() > 0.1; // 90% chance of sufficient data
    const convergence = Math.random() > 0.05; // 95% model convergence rate
    
    if (hasEnoughData && convergence && dataQuality > 0.75) {
      trained[ticker] = "trained";
      console.log(`✓ Models trained successfully for ${ticker}`);
      console.log(`  - Direction classifier AUC: ${(0.6 + Math.random() * 0.3).toFixed(3)}`);
      console.log(`  - Return prediction MAE: ${(0.08 + Math.random() * 0.05).toFixed(3)}`);
    } else {
      trained[ticker] = "failed";
      console.log(`✗ Training failed for ${ticker}: ${
        !hasEnoughData ? 'insufficient data' : 
        !convergence ? 'model convergence issues' : 
        'poor data quality'
      }`);
    }
  });

  return {
    status: "ok",
    trained
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: TrainRequest = await req.json();
    
    // Apply defaults
    const region = request.region || "IN";
    const tickers = request.tickers || [];
    
    if (tickers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one ticker is required for training' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simulate training delay based on number of tickers
    const trainingDelay = Math.min(5000, tickers.length * 1000);
    await new Promise(resolve => setTimeout(resolve, trainingDelay));

    const result = simulateTraining(request);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in market-train function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});