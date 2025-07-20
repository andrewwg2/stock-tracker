/**
 * usePrice Hook
 * Manages price fetching and portfolio price updates
 */

import { useState, useCallback } from 'react';
import { priceService } from '../services/priceService';
import { useTradeStore } from '../store/tradeStore';
import { useAsyncOperation } from './useAsyncOperation';

export interface UsePriceReturn {
  fetchPrice: (symbol: string, refresh?: boolean) => Promise<number | null>;
  refreshAllPrices: () => Promise<void>;
  refreshSymbolPrices: (symbols: string[]) => Promise<Map<string, number>>;
  getCachedPrice: (symbol: string) => number | null;
  isLoading: boolean;
  error: string | null;
}

export const usePrice = (): UsePriceReturn => {
  const [lastError, setLastError] = useState<string | null>(null);
  const updatePrices = useTradeStore(state => state.updatePrices);
  
  const {
    execute: executeSingleFetch,
    isLoading: isSingleLoading,
    error: singleError
  } = useAsyncOperation<number | null>();

  const {
    execute: executeRefreshAll,
    isLoading: isRefreshLoading,
    error: refreshError
  } = useAsyncOperation<void>();

  const {
    execute: executeSymbolRefresh,
    isLoading: isSymbolRefreshLoading,
    error: symbolRefreshError
  } = useAsyncOperation<Map<string, number>>();

  // Fetch price for a single stock
  const fetchPrice = useCallback(async (symbol: string, refresh: boolean = false): Promise<number | null> => {
    setLastError(null);
    
    if (!symbol.trim()) {
      setLastError('Invalid symbol');
      return null;
    }

    try {
      const price = await executeSingleFetch(async () => {
        return await priceService.fetchPrice(symbol, refresh);
      });
      
      if (price === null) {
        setLastError(`Could not fetch price for ${symbol}`);
      }
      
      return price;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch stock price';
      setLastError(errorMessage);
      return null;
    }
  }, [executeSingleFetch]);

  // Fetch prices for all stocks in the portfolio and update the store
  const refreshAllPrices = useCallback(async (): Promise<void> => {
    setLastError(null);

    try {
      await executeRefreshAll(async () => {
        const trades = useTradeStore.getState().trades;
        
        if (!trades.length) {
          return;
        }
        
        // Get unique symbols from all trades
        const symbols = [...new Set(trades.map(trade => trade.symbol))];
        
        if (symbols.length === 0) {
          return;
        }
        
        console.log(`Refreshing prices for ${symbols.length} symbols...`);
        
        // Fetch current prices for all symbols
        const priceMap = await priceService.fetchBatchPrices(symbols, true);
        
        // Update store with new prices
        updatePrices(priceMap);
        
        console.log(`Updated prices for ${priceMap.size} symbols`);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh prices';
      setLastError(errorMessage);
      console.error('Price refresh failed:', error);
      throw error;
    }
  }, [executeRefreshAll, updatePrices]);

  // Fetch prices for specific symbols
  const refreshSymbolPrices = useCallback(async (symbols: string[]): Promise<Map<string, number>> => {
    setLastError(null);

    if (!symbols.length) {
      return new Map();
    }

    try {
      const priceMap = await executeSymbolRefresh(async () => {
        const cleanSymbols = symbols.filter(symbol => symbol.trim().length > 0);
        
        if (cleanSymbols.length === 0) {
          return new Map();
        }

        console.log(`Refreshing prices for symbols: ${cleanSymbols.join(', ')}`);
        
        const priceMap = await priceService.fetchBatchPrices(cleanSymbols, true);
        
        // Update store with new prices
        updatePrices(priceMap);
        
        return priceMap;
      });

      return priceMap || new Map();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh symbol prices';
      setLastError(errorMessage);
      return new Map();
    }
  }, [executeSymbolRefresh, updatePrices]);

  // Get cached price without triggering a fetch
  const getCachedPrice = useCallback((symbol: string): number | null => {
    try {
      return priceService.getCachedPrice(symbol);
    } catch (error) {
      console.error(`Error getting cached price for ${symbol}:`, error);
      return null;
    }
  }, []);

  const isLoading = isSingleLoading || isRefreshLoading || isSymbolRefreshLoading;
  const error = lastError || singleError || refreshError || symbolRefreshError;

  return {
    fetchPrice,
    refreshAllPrices,
    refreshSymbolPrices,
    getCachedPrice,
    isLoading,
    error,
  };
};
