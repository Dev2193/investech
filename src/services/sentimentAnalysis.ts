import { pipeline } from '@huggingface/transformers';

// FinBERT-like sentiment analysis using transformers.js
class SentimentAnalyzer {
  private pipe: any = null;
  private initPromise: Promise<void> | null = null;

  private async ensurePipeline(): Promise<any> {
    if (this.pipe) return this.pipe;
    
    if (!this.initPromise) {
      this.initPromise = this.initPipeline();
    }
    
    await this.initPromise;
    return this.pipe!;
  }

  private async initPipeline(): Promise<void> {
    try {
      // Use FinBERT for financial sentiment analysis
      this.pipe = await pipeline(
        'text-classification',
        'ProsusAI/finbert',
        { 
          device: 'webgpu',
          dtype: 'fp16'
        }
      );
    } catch (error) {
      console.warn('WebGPU not available, falling back to CPU:', error);
      // Fallback to CPU if WebGPU fails
      this.pipe = await pipeline(
        'text-classification',
        'ProsusAI/finbert'
      );
    }
  }

  /**
   * Return sentiment scores in [-1,1], where >0 is positive
   */
  async sentimentScores(texts: string[]): Promise<number[]> {
    if (texts.length === 0) return [];
    
    const pipe = await this.ensurePipeline();
    const results = await pipe(texts);
    
    return results.map((result: any) => {
      const scores = Array.isArray(result) ? result : [result];
      let sentimentScore = 0;
      
      for (const item of scores) {
        const label = item.label.toUpperCase();
        const score = item.score;
        
        if (label.includes('POS')) {
          sentimentScore = score;
        } else if (label.includes('NEG')) {
          sentimentScore = -score;
        }
        // Neutral scores remain 0
      }
      
      return Math.max(-1, Math.min(1, sentimentScore));
    });
  }

  /**
   * Process a single text for sentiment
   */
  async analyzeSentiment(text: string): Promise<{
    score: number;
    label: string;
    confidence: number;
  }> {
    const scores = await this.sentimentScores([text]);
    const score = scores[0];
    
    return {
      score,
      label: score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral',
      confidence: Math.abs(score)
    };
  }
}

export interface NewsArticle {
  ticker: string;
  published_at: string;
  region: string;
  text: string;
}

export interface DailySignal {
  ticker: string;
  date: string;
  sent_mean: number;
  flow: number;
}

/**
 * Aggregate daily sentiment signals from news articles
 */
export async function aggregateDailySignals(
  articles: NewsArticle[], 
  regionBoost: number = 1.5
): Promise<DailySignal[]> {
  if (articles.length === 0) {
    return [];
  }

  const analyzer = new SentimentAnalyzer();
  
  // Extract texts for batch processing
  const texts = articles.map(article => article.text);
  const sentiments = await analyzer.sentimentScores(texts);
  
  // Add sentiment scores to articles
  const articlesWithSentiment = articles.map((article, index) => ({
    ...article,
    sentiment: sentiments[index],
    weight: article.region.toUpperCase() === 'IN' ? regionBoost : 1.0
  }));

  // Group by ticker and date
  const dailyGroups: Record<string, (NewsArticle & { sentiment: number; weight: number })[]> = {};
  
  articlesWithSentiment.forEach(article => {
    const date = new Date(article.published_at).toISOString().split('T')[0];
    const key = `${article.ticker}_${date}`;
    
    if (!dailyGroups[key]) {
      dailyGroups[key] = [];
    }
    dailyGroups[key].push(article);
  });

  // Aggregate signals for each group
  const signals: DailySignal[] = [];
  
  Object.entries(dailyGroups).forEach(([key, group]) => {
    const [ticker, date] = key.split('_');
    
    // Calculate weighted sentiment mean
    const totalWeightedSentiment = group.reduce((sum, article) => 
      sum + (article.sentiment * article.weight), 0
    );
    const totalWeight = group.reduce((sum, article) => sum + article.weight, 0);
    
    const sent_mean = totalWeight > 0 ? totalWeightedSentiment / totalWeight : 0;
    const flow = totalWeight;
    
    signals.push({
      ticker,
      date,
      sent_mean: Math.round(sent_mean * 1000) / 1000, // Round to 3 decimals
      flow: Math.round(flow * 100) / 100 // Round to 2 decimals
    });
  });

  return signals.sort((a, b) => a.date.localeCompare(b.date));
}

// Export singleton instance
export const sentimentAnalyzer = new SentimentAnalyzer();