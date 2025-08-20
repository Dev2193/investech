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

// Simulate loading price data (like load_prices in Python)
async function loadPrices(ticker: string): Promise<any[]> {
  console.log(`Loading price data for ${ticker}...`);
  // Simulate loading from data/prices_{ticker}.csv|parquet
  
  // Mock price data with realistic structure
  const prices = [];
  const startDate = new Date('2022-01-01');
  let currentPrice = 100 + Math.random() * 900; // Starting price between 100-1000
  
  for (let i = 0; i < 500; i++) { // ~2 years of daily data
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Simulate price movement with some volatility
    const change = (Math.random() - 0.5) * 0.04; // ±2% daily change
    currentPrice *= (1 + change);
    
    prices.push({
      date: date.toISOString().split('T')[0],
      open: currentPrice * (0.99 + Math.random() * 0.02),
      high: currentPrice * (1.001 + Math.random() * 0.02),
      low: currentPrice * (0.98 + Math.random() * 0.02),
      close: currentPrice,
      volume: Math.floor(1000000 + Math.random() * 9000000),
      ticker
    });
  }
  
  console.log(`✓ Loaded ${prices.length} price records for ${ticker}`);
  return prices;
}

// Simulate loading news/text data (like load_text in Python)
async function loadText(ticker: string): Promise<any[]> {
  console.log(`Loading news data for ${ticker}...`);
  
  // Mock news data
  const newsTemplates = [
    `${ticker} reports strong quarterly earnings with revenue growth`,
    `Analysts upgrade ${ticker} target price following positive results`,
    `${ticker} announces new strategic partnerships and expansion plans`,
    `Market volatility affects ${ticker} trading volumes`,
    `${ticker} faces regulatory challenges in key markets`,
    `${ticker} launches innovative products to capture market share`,
    `Institutional investors increase holdings in ${ticker}`,
    `${ticker} management provides optimistic guidance for next quarter`
  ];
  
  const news = [];
  const regions = ['IN', 'US', 'EU'];
  
  for (let i = 0; i < 200; i++) { // ~200 news articles
    const daysAgo = Math.floor(Math.random() * 365);
    const publishDate = new Date();
    publishDate.setDate(publishDate.getDate() - daysAgo);
    
    news.push({
      published_at: publishDate.toISOString(),
      region: regions[Math.floor(Math.random() * regions.length)],
      text: newsTemplates[Math.floor(Math.random() * newsTemplates.length)],
      ticker
    });
  }
  
  console.log(`✓ Loaded ${news.length} news articles for ${ticker}`);
  return news;
}

// Simulate aggregating daily signals (like aggregate_daily_signals in Python)
async function aggregateDailySignals(news: any[], regionBoost: number): Promise<any[]> {
  console.log(`Aggregating daily sentiment signals with region boost: ${regionBoost}`);
  
  // Group news by date and calculate mock sentiment
  const dailyGroups: Record<string, any[]> = {};
  
  news.forEach(article => {
    const date = new Date(article.published_at).toISOString().split('T')[0];
    if (!dailyGroups[date]) {
      dailyGroups[date] = [];
    }
    dailyGroups[date].push(article);
  });
  
  const signals = Object.entries(dailyGroups).map(([date, articles]) => {
    // Mock sentiment calculation
    const sentiment = (Math.random() - 0.5) * 2; // -1 to 1
    const weight = articles.reduce((sum, article) => 
      sum + (article.region === 'IN' ? regionBoost : 1.0), 0
    );
    
    return {
      ticker: articles[0].ticker,
      date,
      sent_mean: sentiment * (weight / articles.length),
      flow: weight
    };
  });
  
  console.log(`✓ Generated ${signals.length} daily sentiment signals`);
  return signals;
}

// Simulate feature engineering and joining (like join_features in Python)
async function joinFeatures(prices: any[], textAgg: any[]): Promise<any[]> {
  console.log('Joining price data with sentiment features...');
  
  // Mock feature engineering
  const joinedData = prices.map(price => {
    const sentimentMatch = textAgg.find(signal => 
      signal.ticker === price.ticker && signal.date === price.date
    );
    
    return {
      ...price,
      sent_mean: sentimentMatch?.sent_mean || 0,
      flow: sentimentMatch?.flow || 0,
      // Add mock technical features
      ret_5d: (Math.random() - 0.5) * 0.1,
      ret_20d: (Math.random() - 0.5) * 0.2,
      ret_60d: (Math.random() - 0.5) * 0.3,
      vol_5d: 0.01 + Math.random() * 0.05,
      vol_20d: 0.015 + Math.random() * 0.06,
      drawdown: -Math.random() * 0.2,
      mom_12m: (Math.random() - 0.5) * 0.4
    };
  });
  
  console.log(`✓ Feature engineering complete: ${joinedData.length} records`);
  return joinedData;
}

// Simulate model training (like train_models in Python)
async function trainModels(data: any[], ticker: string, horizonDays: number = 252): Promise<any> {
  console.log(`Training models for ${ticker} with ${horizonDays} day horizon...`);
  console.log(`Dataset size: ${data.length} records`);
  
  // Simulate LightGBM training steps
  console.log('- Building feature datasets with technical indicators');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('- Training LGBMClassifier for direction prediction');
  await new Promise(resolve => setTimeout(resolve, 800));
  
  console.log('- Training quantile regressors (p10, p50, p90)');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('- Cross-validating with TimeSeriesSplit');
  await new Promise(resolve => setTimeout(resolve, 600));
  
  console.log('- Evaluating model performance');
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // Mock model metrics
  const metrics = {
    direction_auc: 0.65 + Math.random() * 0.25, // 0.65-0.90
    return_mae: 0.05 + Math.random() * 0.05, // 0.05-0.10
    feature_columns: [
      'ret_5d', 'ret_20d', 'ret_60d', 'vol_5d', 'vol_20d', 
      'sent_mean', 'flow', 'drawdown', 'mom_12m'
    ]
  };
  
  console.log(`✓ Model training complete for ${ticker}`);
  console.log(`  - Direction classifier AUC: ${metrics.direction_auc.toFixed(3)}`);
  console.log(`  - Return prediction MAE: ${metrics.return_mae.toFixed(3)}`);
  
  return metrics;
}

// Main training function (like main in Python)
async function trainTicker(ticker: string, region: string = "IN", start?: string, end?: string): Promise<string> {
  try {
    console.log(`\n=== Starting training for ${ticker} (region: ${region}) ===`);
    if (start) console.log(`Training period: ${start} to ${end || 'present'}`);
    
    // Step 1: Load price data
    const prices = await loadPrices(ticker);
    
    // Step 2: Load text/news data  
    const news = await loadText(ticker);
    
    // Step 3: Aggregate daily signals with region boost
    const regionBoost = region.toUpperCase() === "IN" ? 1.5 : 1.0;
    const textAgg = await aggregateDailySignals(news, regionBoost);
    
    // Step 4: Join features and engineer
    const df = await joinFeatures(prices, textAgg);
    
    // Step 5: Train models and save
    const horizonDays = 252; // 1 year horizon
    const metadata = await trainModels(df, ticker, horizonDays);
    
    console.log(`✓ Successfully trained and saved models for ${ticker}`);
    console.log(`Feature columns: ${metadata.feature_columns.join(', ')}`);
    
    return "trained";
  } catch (error) {
    console.error(`✗ Training failed for ${ticker}:`, error.message);
    return "failed";
  }
}

function simulateTraining(request: TrainRequest): TrainResponse {
  // Apply Pydantic schema defaults
  const tickers = request.tickers || [];
  const region = request.region || "IN";
  const start = request.start;
  const end = request.end;
  
  const trained: Record<string, string> = {};
  
  // Start background training tasks
  tickers.forEach(ticker => {
    // Use EdgeRuntime.waitUntil for background training
    const trainingTask = trainTicker(ticker, region, start, end).then(status => {
      trained[ticker] = status;
      console.log(`Background training completed for ${ticker}: ${status}`);
    });
    
    // Mark as background task so function doesn't terminate
    EdgeRuntime.waitUntil(trainingTask);
    
    // Set initial status
    trained[ticker] = "training";
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

    console.log(`\n=== Training Request ===`);
    console.log(`Tickers: ${tickers.join(', ')}`);
    console.log(`Region: ${region}`);
    if (request.start) console.log(`Start Date: ${request.start}`);
    if (request.end) console.log(`End Date: ${request.end}`);

    // Start training simulation with background tasks
    const result = simulateTraining(request);

    // Return immediate response while training continues in background
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

// Handle function shutdown gracefully
addEventListener('beforeunload', (ev) => {
  console.log('Training function shutdown due to:', ev.detail?.reason);
  console.log('Any ongoing training tasks will continue in background');
});