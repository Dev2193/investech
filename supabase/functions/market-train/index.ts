import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrainRequest {
  tickers?: string[];
  region: string;
}

interface TrainResponse {
  status: string;
  trained: Record<string, string>;
}

function simulateTraining(request: TrainRequest): TrainResponse {
  const trained: Record<string, string> = {};
  
  // Simulate training process for each ticker
  request.tickers?.forEach(ticker => {
    // Simulate random training success/failure (95% success rate)
    const success = Math.random() > 0.05;
    trained[ticker] = success ? "trained" : "failed";
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
    
    if (!request.region) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: region' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!request.tickers || request.tickers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one ticker is required for training' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simulate training delay based on number of tickers
    const trainingDelay = Math.min(5000, request.tickers.length * 1000);
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