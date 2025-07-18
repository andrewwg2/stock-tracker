import { useState } from 'react';
import { stockApiService, storageService } from '../services';
import type { StockQuoteDTO, StockPriceRequestDTO } from '../dto';

export interface UseStockPriceReturn {
  fetchPrice: (symbol: string, refresh?: boolean) => Promise<number | null>;
  fetchQuote: (request: StockPriceRequestDTO) => Promise<StockQuoteDTO | null>;
  fetchBatchPrices: (symbols: string[]) => Promise<Map<string, number>>;
  lastQuote: StockQuoteDTO | null;
  isLoading: boolean;
  error: string | null;
}

export function useStockPrice(): UseStockPriceReturn {
  const [lastQuote, setLastQuote] = useState<StockQuoteDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch price only
  const fetchPrice = async (symbol: string, refresh: boolean = false): Promise<number | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to get from cache first
      if (!refresh) {
        const cacheKey = `price-${symbol.toUpperCase()}`;
        const { data, expired } = storageService.loadCache<number>(cacheKey);
        
        if (data !== null && !expired) {
          setIsLoading(false);
          return data;
        }
      }
      
      // Fetch from API
      const price = await stockApiService.getStockPrice(symbol);
      
      // Store in cache
      const cacheKey = `price-${symbol.toUpperCase()}`;
      storageService.saveCache(cacheKey, price);
      
      setIsLoading(false);
      return price;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching stock price';
      console.error(errorMessage);
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  };

  // Fetch full quote
  const fetchQuote = async (request: StockPriceRequestDTO): Promise<StockQuoteDTO | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to get from cache first
      if (!request.refresh) {
        const cacheKey = `quote-${request.symbol.toUpperCase()}`;
        const { data, expired } = storageService.loadCache<StockQuoteDTO>(cacheKey);
        
        if (data !== null && !expired) {
          setLastQuote(data);
          setIsLoading(false);
          return data;
        }
      }
      
      // Fetch from API
      const quote = await stockApiService.getStockQuoteDTO(request);
      
      // Store in cache
      const cacheKey = `quote-${request.symbol.toUpperCase()}`;
      storageService.saveCache(cacheKey, quote);
      
      // Update state
      setLastQuote(quote);
      
      setIsLoading(false);
      return quote;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching stock quote';
      console.error(errorMessage);
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  };

  // Fetch multiple prices at once
  const fetchBatchPrices = async (symbols: string[]): Promise<Map<string, number>> => {
    if (!symbols.length) return new Map();
    
    setIsLoading(true);
    setError(null);
    
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
      setIsLoading(false);
      return priceMap;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching batch prices';
      console.error(errorMessage);
      setError(errorMessage);
      setIsLoading(false);
      return priceMap; // Return what we have so far
    }
  };

  return {
    fetchPrice,
    fetchQuote,
    fetchBatchPrices,
    lastQuote,
    isLoading,
    error
  };
}
