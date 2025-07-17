import { useState, useCallback } from 'react';
import { stockApiService } from '../services';

export interface UseStockPriceReturn {
  fetchPrice: (symbol: string) => Promise<number | null>;
  isLoading: boolean;
  error: string | null;
}

export function useStockPrice(): UseStockPriceReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = useCallback(async (symbol: string): Promise<number | null> => {
    if (!symbol.trim()) {
      setError('Symbol is required');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const price = await stockApiService.getStockPrice(symbol);
      return price;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stock price';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    fetchPrice,
    isLoading,
    error
  };
}
