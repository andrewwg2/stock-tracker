/**
 * useStockPrice Hook
 * Manages individual stock price fetching and caching
 */

import { useState } from 'react';
import { priceService } from '../services';
import { useAsyncOperation } from './useAsyncOperation';
import type { StockQuoteDTO, StockPriceRequestDTO } from '../dto';

export interface UseStockPriceReturn {
  fetchPrice: (symbol: string, refresh?: boolean) => Promise<number | null>;
  fetchBatchPrices: (symbols: string[]) => Promise<Map<string, number>>;
  getCachedPrice: (symbol: string) => number | null;
  clearCache: (symbol?: string) => void;
  isLoading: boolean;
  error: string | null;
}

export const useStockPrice = (): UseStockPriceReturn => {
  const [lastError, setLastError] = useState<string | null>(null);
  
  const {
    execute: executeFetchPrice,
    isLoading: isFetchingPrice,
    error: fetchPriceError
  } = useAsyncOperation<number | null>();

  const {
    execute: executeBatchFetch,
    isLoading: isBatchLoading,
    error: batchError
  } = useAsyncOperation<Map<string, number>>();

  const fetchPrice = async (symbol: string, refresh: boolean = false): Promise<number | null> => {
    setLastError(null);
    
    if (!symbol.trim()) {
      setLastError('Invalid symbol');
      return null;
    }

    try {
      const result = await executeFetchPrice(async () => {
        return await priceService.fetchPrice(symbol, refresh);
      });

      return result || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch price';
      setLastError(errorMessage);
      return null;
    }
  };

  const fetchBatchPrices = async (symbols: string[]): Promise<Map<string, number>> => {
    setLastError(null);
    
    if (!symbols.length) {
      return new Map();
    }

    try {
      const result = await executeBatchFetch(async () => {
        return await priceService.fetchBatchPrices(symbols, false);
      });

      return result || new Map();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch batch prices';
      setLastError(errorMessage);
      return new Map();
    }
  };

  const getCachedPrice = (symbol: string): number | null => {
    try {
      return priceService.getCachedPrice(symbol);
    } catch (error) {
      console.error(`Error getting cached price for ${symbol}:`, error);
      return null;
    }
  };

  const clearCache = (symbol?: string): void => {
    try {
      priceService.clearPriceCache(symbol);
    } catch (error) {
      console.error('Error clearing price cache:', error);
    }
  };

  const isLoading = isFetchingPrice || isBatchLoading;
  const error = lastError || fetchPriceError || batchError;

  return {
    fetchPrice,
    fetchBatchPrices,
    getCachedPrice,
    clearCache,
    isLoading,
    error,
  };
};
