import { stockApiService, storageService } from '../services';

export interface PriceService {
  fetchPrice(symbol: string, refresh?: boolean): Promise<number | null>;
  fetchBatchPrices(symbols: string[]): Promise<Map<string, number>>;
}

class PriceServiceImpl implements PriceService {
  async fetchPrice(symbol: string, refresh: boolean = false): Promise<number | null> {
    try {
      // Try to get from cache first
      if (!refresh) {
        const cacheKey = `price-${symbol.toUpperCase()}`;
        const { data, expired } = storageService.loadCache<number>(cacheKey);
        
        if (data !== null && !expired) {
          return data;
        }
      }
      
      // Fetch from API
      const price = await stockApiService.getStockPrice(symbol);
      
      // Store in cache
      const cacheKey = `price-${symbol.toUpperCase()}`;
      storageService.saveCache(cacheKey, price);
      
      return price;
    } catch (err) {
      console.error('Error fetching price:', err);
      return null;
    }
  }

  async fetchBatchPrices(symbols: string[]): Promise<Map<string, number>> {
    if (!symbols.length) return new Map();
    
    const priceMap = new Map<string, number>();
    const symbolsToFetch: string[] = [];
    
    // Check cache first
    for (const symbol of symbols) {
      const cacheKey = `price-${symbol.toUpperCase()}`;
      const { data, expired } = storageService.loadCache<number>(cacheKey);
      
      if (data !== null && !expired) {
        priceMap.set(symbol.toUpperCase(), data);
      } else {
        symbolsToFetch.push(symbol);
      }
    }
    
    // Fetch prices that weren't in cache
    try {
      const fetchPromises = symbolsToFetch.map(async (symbol) => {
        try {
          const price = await stockApiService.getStockPrice(symbol);
          priceMap.set(symbol.toUpperCase(), price);
          
          // Update cache
          const cacheKey = `price-${symbol.toUpperCase()}`;
          storageService.saveCache(cacheKey, price);
          
          return true;
        } catch (err) {
          console.error(`Error fetching price for ${symbol}:`, err);
          return false;
        }
      });
      
      await Promise.all(fetchPromises);
      return priceMap;
    } catch (err) {
      console.error('Error in batch price fetching:', err);
      return priceMap; // Return what we have so far
    }
  }
}

export const priceService: PriceService = new PriceServiceImpl();
