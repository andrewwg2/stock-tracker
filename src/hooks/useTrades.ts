import { useState, useEffect } from 'react';
import type { Trade, TradeFormData } from '../types';
import { tradeService, storageService } from '../services';

export interface UseTradesReturn {
  trades: Trade[];
  addTrade: (formData: TradeFormData) => void;
  sellTrade: (tradeId: string, sellPrice: number) => void;
  clearAllTrades: () => void;
  isLoading: boolean;
  error: string | null;
}

export function useTrades(): UseTradesReturn {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load trades from storage on mount
  useEffect(() => {
    try {
      const loadedTrades = storageService.loadTrades();
      setTrades(loadedTrades);
      setError(null);
    } catch (err) {
      setError('Failed to load trades from storage');
      console.error('Error loading trades:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save trades to storage whenever trades change
  useEffect(() => {
    if (!isLoading) {
      storageService.saveTrades(trades);
    }
  }, [trades, isLoading]);

  const addTrade = (formData: TradeFormData) => {
    try {
      const newTrade = tradeService.createTrade(formData);
      setTrades(prevTrades => [...prevTrades, newTrade]);
      setError(null);
    } catch (err) {
      setError('Failed to add trade');
      console.error('Error adding trade:', err);
    }
  };

  const sellTrade = (tradeId: string, sellPrice: number) => {
    try {
      setTrades(prevTrades =>
        prevTrades.map(trade => {
          if (trade.id === tradeId) {
            return tradeService.sellTrade(trade, sellPrice);
          }
          return trade;
        })
      );
      setError(null);
    } catch (err) {
      setError('Failed to sell trade');
      console.error('Error selling trade:', err);
    }
  };

  const clearAllTrades = () => {
    try {
      setTrades([]);
      storageService.clearTrades();
      setError(null);
    } catch (err) {
      setError('Failed to clear trades');
      console.error('Error clearing trades:', err);
    }
  };

  return {
    trades,
    addTrade,
    sellTrade,
    clearAllTrades,
    isLoading,
    error
  };
}
