import { useState } from 'react';
import { priceService } from '../services/priceService';
import { useTradeStore } from '../store/tradeStore';

export function usePrice() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updatePrices = useTradeStore(state => state.updatePrices);
  
  // Fetch price for a single stock
  const fetchPrice = async (symbol: string, refresh: boolean = false): Promise<number | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const price = await priceService.fetchPrice(symbol, refresh);
      setIsLoading(false);
      
      if (price === null) {
        setError(`Could not fetch price for ${symbol}`);
      }
      
      return price;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stock price';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  };
  
  // Fetch prices for all stocks in the portfolio and update the store
  const refreshAllPrices = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const trades = useTradeStore.getState().trades;
      
      if (!trades.length) {
        setIsLoading(false);
        return;
      }
      
      // Get unique symbols
      const symbols = [...new Set(trades.map(trade => trade.symbol))];
      
      // Fetch current prices for all symbols
      const priceMap = await priceService.fetchBatchPrices(symbols);
      
      // Update store with new prices
      updatePrices(priceMap);
      
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh prices';
      setError(errorMessage);
      setIsLoading(false);
    }
  };
  
  return {
    fetchPrice,
    refreshAllPrices,
    isLoading,
    error
  };
}
