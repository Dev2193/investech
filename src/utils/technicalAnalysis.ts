export interface PriceData {
  date: string;
  close: number;
  ticker: string;
}

export interface TechnicalFeatures {
  ret_5d: number;
  ret_20d: number;
  ret_60d: number;
  ret_120d: number;
  ret_250d: number;
  vol_5d: number;
  vol_20d: number;
  vol_60d: number;
  vol_120d: number;
  vol_250d: number;
  drawdown: number;
  mom_12m: number;
  dayofweek: number;
}

export function calculateReturns(prices: number[], periods: number): number {
  if (prices.length < periods + 1) return 0;
  const current = prices[prices.length - 1];
  const past = prices[prices.length - 1 - periods];
  return past ? (current - past) / past : 0;
}

export function calculateVolatility(prices: number[], periods: number): number {
  if (prices.length < periods + 1) return 0;
  
  const returns = [];
  for (let i = prices.length - periods; i < prices.length; i++) {
    if (i > 0 && prices[i - 1]) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
  }
  
  if (returns.length === 0) return 0;
  
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  return Math.sqrt(variance);
}

export function calculateDrawdown(prices: number[]): number {
  if (prices.length === 0) return 0;
  
  let maxPrice = prices[0];
  let maxDrawdown = 0;
  
  for (const price of prices) {
    if (price > maxPrice) {
      maxPrice = price;
    }
    const drawdown = (price / maxPrice) - 1;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }
  
  return maxDrawdown;
}

export function addTechnicalFeatures(data: PriceData[]): (PriceData & TechnicalFeatures)[] {
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return sortedData.map((item, index) => {
    const prices = sortedData.slice(0, index + 1).map(d => d.close);
    const windows = [5, 20, 60, 120, 250];
    
    const features: TechnicalFeatures = {
      ret_5d: calculateReturns(prices, 5),
      ret_20d: calculateReturns(prices, 20),
      ret_60d: calculateReturns(prices, 60),
      ret_120d: calculateReturns(prices, 120),
      ret_250d: calculateReturns(prices, 250),
      vol_5d: calculateVolatility(prices, 5),
      vol_20d: calculateVolatility(prices, 20),
      vol_60d: calculateVolatility(prices, 60),
      vol_120d: calculateVolatility(prices, 120),
      vol_250d: calculateVolatility(prices, 250),
      drawdown: calculateDrawdown(prices),
      mom_12m: calculateReturns(prices, 252), // 12 months ≈ 252 trading days
      dayofweek: new Date(item.date).getDay(),
    };
    
    // Replace Infinity and -Infinity with 0
    Object.keys(features).forEach(key => {
      const value = features[key as keyof TechnicalFeatures];
      if (!isFinite(value)) {
        (features as any)[key] = 0;
      }
    });
    
    return { ...item, ...features };
  });
}

export function joinFeatures(
  priceData: PriceData[],
  textAgg: any[],
  macroData?: any[]
): any[] {
  let result = priceData.map(price => {
    const textMatch = textAgg.find(text => 
      text.ticker === price.ticker && text.date === price.date
    );
    return { ...price, ...textMatch };
  });
  
  if (macroData) {
    result = result.map(item => {
      const macroMatch = macroData.find(macro => macro.date === item.date);
      return { ...item, ...macroMatch };
    });
  }
  
  return addTechnicalFeatures(result);
}