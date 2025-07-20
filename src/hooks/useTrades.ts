/**
 * useTrades Hook
 * Manages trade state and operations
 */

import { useEffect, useCallback } from 'react';
import { useTradeStore } from '../store/tradeStore';
import { usePrice } from './usePrice';
import type { CreateTradeDTO, TradeFilterDTO } from '../dto';

export const useTrades = () => {
  const { 
    trades, 
    filteredList,
    isLoading: isStoreLoading, 
    error: storeError,
    initialize,
    addTrade,
    sellTrade,
    clearAllTrades,
    filterTrades
  } = useTradeStore();
  
  const { 
    refreshAllPrices, 
    isLoading: isPriceLoading, 
    error: priceError 
  } = usePrice();

  // Initialize store on component mount
  useEffect(() => {
    const loadData = async () => {
      await initialize();
      // Don't auto-refresh prices on initial load to avoid overwhelming the API
    };
    
    loadData();
  }, [initialize]);

  // Memoized refresh function that also updates prices
  const handleRefreshPrices = useCallback(async () => {
    try {
      await refreshAllPrices();
    } catch (error) {
      console.error('Failed to refresh prices:', error);
    }
  }, [refreshAllPrices]);

  // Memoized filter function
  const handleFilterTrades = useCallback(async (filter: TradeFilterDTO) => {
    await filterTrades(filter);
    // Optionally refresh prices after filtering
    // await refreshAllPrices();
  }, [filterTrades]);

  // Memoized add trade function
  const handleAddTrade = useCallback(async (tradeData: CreateTradeDTO) => {
    try {
      await addTrade(tradeData);
      // Optionally refresh prices for the new symbol
      // await refreshPriceForSymbol(tradeData.symbol);
    } catch (error) {
      console.error('Failed to add trade:', error);
      throw error;
    }
  }, [addTrade]);

  // Memoized sell trade function
  const handleSellTrade = useCallback(async (tradeId: string, sellPrice: number) => {
    try {
      await sellTrade(tradeId, sellPrice);
    } catch (error) {
      console.error('Failed to sell trade:', error);
      throw error;
    }
  }, [sellTrade]);

  // Memoized clear all function
  const handleClearAllTrades = useCallback(async () => {
    try {
      await clearAllTrades();
    } catch (error) {
      console.error('Failed to clear trades:', error);
      throw error;
    }
  }, [clearAllTrades]);

  // Combine errors from store and price service
  const error = storeError || priceError;
  const isLoading = isStoreLoading || isPriceLoading;
  
  return {
    // Data
    trades: filteredList?.trades || trades,
    tradesList: filteredList,
    allTrades: trades,
    
    // Actions
    addTrade: handleAddTrade,
    sellTrade: handleSellTrade,
    clearAllTrades: handleClearAllTrades,
    filterTrades: handleFilterTrades,
    refreshPrices: handleRefreshPrices,
    
    // Status
    isLoading,
    error,
    
    // Additional computed values
    hasOpenPositions: trades.some(trade => !trade.sellPrice),
    totalTrades: trades.length,
    openPositions: trades.filter(trade => !trade.sellPrice).length,
    closedPositions: trades.filter(trade => trade.sellPrice).length,
  };
};
