import { useEffect } from 'react';
import { useTradeStore } from '../store/tradeStore';
import { usePrice } from './usePrice';
import type { CreateTradeDTO, TradeFilterDTO } from '../dto';

export function useTrades() {
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
      await refreshAllPrices();
    };
    
    loadData();
  }, [initialize]);
  
  // Combine errors from store and price service
  const error = storeError || priceError;
  
  return {
    // Data
    trades,
    tradesList: filteredList,
    
    // Actions
    addTrade,
    sellTrade,
    clearAllTrades,
    filterTrades: (filter: TradeFilterDTO) => {
      filterTrades(filter);
      // After applying filters, refresh prices
      refreshAllPrices();
    },
    refreshPrices: refreshAllPrices,
    
    // Status
    isLoading: isStoreLoading || isPriceLoading,
    error
  };
}
