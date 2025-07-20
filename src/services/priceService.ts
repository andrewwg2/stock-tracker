/**
 * Price Service
 * Handles stock price fetching with caching and batch operations
 */

import { stockApiService } from './stockApiService';
import { storageService } from './storageService';
import { CACHE_DURATION, ERROR_MESSAGES } from '../utils';

export interface PriceService {
  fetchPrice(symbol: string, refresh?: boolean): Promise<number | null>;
  fetchBatchPrices(symbols: string[], forceRefresh?: boolean): Promise<Map<string, number>>;
  refreshAllCachedPrices(): Promise<void>;
  getCachedPrice(symbol: string): number | null;
  clearPriceCache(symbol?: string): void;
}

class PriceServiceImpl implements PriceService {
  private readonly cacheKeyPrefix = 'price-';
  private readonly batchSize = 5;
  private readonly requestDelay = 200; // ms between batches

  async fetchPrice(symbol: string, refresh: boolean = false): Promise<number | null> {
    const normalizedSymbol = symbol.toUpperCase().trim();
    
    if (!normalizedSymbol) {
      throw new Error('Invalid symbol');
    }

    try {
      // Check cache first unless refresh is requested
      if (!refresh) {
        const cached = this.getCachedPrice(normalizedSymbol);
        if (cached !== null) {
          return cached;
        }
      }

      // Fetch from API
      const price = await stockApiService.getStockPrice(normalizedSymbol);
      
      // Cache the result
      if (price !== null) {
        this.cachePrice(normalizedSymbol, price);
      }
      
      return price;
    } catch (error) {
      console.error(`Error fetching price for ${normalizedSymbol}:`, error);
      
      // Try to return cached price as fallback
      const cachedPrice = this.getCachedPrice(normalizedSymbol);
      if (cachedPrice !== null) {
        console.warn(`Using cached price for ${normalizedSymbol}`);
        return cachedPrice;
      }
      
      return null;
    }
  }

  async fetchBatchPrices(
    symbols: string[], 
    forceRefresh: boolean = false
  ): Promise<Map<string, number>> {
    const priceMap = new Map<string, number>();
    const symbolsToFetch: string[] = [];
    
    // Normalize symbols
    const normalizedSymbols = symbols.map(s => s.toUpperCase().trim()).filter(Boolean);
    
    if (normalizedSymbols.length === 0) {
      return priceMap;
    }

    // Check cache first unless forceRefresh is true
    if (!forceRefresh) {
      for (const symbol of normalizedSymbols) {
        const cachedPrice = this.getCachedPrice(symbol);
        if (cachedPrice !== null) {
          priceMap.set(symbol, cachedPrice);
        } else {
          symbolsToFetch.push(symbol);
        }
      }
    } else {
      symbolsToFetch.push(...normalizedSymbols);
    }

    if (symbolsToFetch.length === 0) {
      return priceMap;
    }

    // Fetch uncached symbols in batches
    const batches = this.chunkArray(symbolsToFetch, this.batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      const batchPromises = batch.map(async (symbol) => {
        try {
          const price = await this.fetchPrice(symbol, true);
          if (price !== null) {
            priceMap.set(symbol, price);
          }
        } catch (error) {
          console.error(`Batch price fetch failed for ${symbol}:`, error);
        }
      });

      await Promise.allSettled(batchPromises);
      
      // Add delay between batches to respect rate limits
      if (i < batches.length - 1) {
        await this.delay(this.requestDelay);
      }
    }

    return priceMap;
  }

  async refreshAllCachedPrices(): Promise<void> {
    try {
      // Get all cached price symbols
      const cachedSymbols = this.getAllCachedSymbols();
      
      if (cachedSymbols.length === 0) {
        return;
      }

      console.log(`Refreshing prices for ${cachedSymbols.length} symbols...`);
      
      // Fetch fresh prices for all cached symbols
      await this.fetchBatchPrices(cachedSymbols, true);
      
      console.log('Price refresh completed');
    } catch (error) {
      console.error('Failed to refresh cached prices:', error);
      throw new Error(ERROR_MESSAGES.PRICE_FETCH_ERROR);
    }
  }

  getCachedPrice(symbol: string): number | null {
    try {
      const cacheKey = `${this.cacheKeyPrefix}${symbol.toUpperCase()}`;
      const cached = storageService.loadCache<number>(cacheKey);
      
      return cached.expired ? null : cached.data;
    } catch (error) {
      console.error(`Failed to get cached price for ${symbol}:`, error);
      return null;
    }
  }

  clearPriceCache(symbol?: string): void {
    try {
      if (symbol) {
        const cacheKey = `${this.cacheKeyPrefix}${symbol.toUpperCase()}`;
        storageService.clearCache(cacheKey.replace('stock-tracker-cache-', ''));
      } else {
        // Clear all price cache entries
        const cachedSymbols = this.getAllCachedSymbols();
        cachedSymbols.forEach(sym => {
          const cacheKey = `${this.cacheKeyPrefix}${sym}`;
          storageService.clearCache(cacheKey.replace('stock-tracker-cache-', ''));
        });
      }
    } catch (error) {
      console.error('Failed to clear price cache:', error);
    }
  }

  // Private helper methods
  private cachePrice(symbol: string, price: number): void {
    try {
      const cacheKey = `${this.cacheKeyPrefix}${symbol}`;
      storageService.saveCache(cacheKey, price, CACHE_DURATION);
    } catch (error) {
      console.error(`Failed to cache price for ${symbol}:`, error);
    }
  }

  private getAllCachedSymbols(): string[] {
    try {
      const symbols: string[] = [];
      
      // This is a simplified approach - in a real app, you might want to
      // maintain a registry of cached symbols
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(`stock-tracker-cache-${this.cacheKeyPrefix}`)) {
          const symbol = key.replace(`stock-tracker-cache-${this.cacheKeyPrefix}`, '');
          if (symbol) {
            // Check if cache is still valid
            const cached = storageService.loadCache<number>(
              key.replace('stock-tracker-cache-', '')
            );
            if (!cached.expired) {
              symbols.push(symbol);
            }
          }
        }
      }
      
      return symbols;
    } catch (error) {
      console.error('Failed to get cached symbols:', error);
      return [];
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const priceService: PriceService = new PriceServiceImpl();
