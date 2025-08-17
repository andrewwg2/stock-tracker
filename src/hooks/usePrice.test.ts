import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePrice } from './usePrice';
import { priceService } from '../services/priceService';
import { useTradeStore } from '../store/tradeStore';
import { useAsyncOperation } from './useAsyncOperation';

// Mock dependencies
vi.mock('../services/priceService');
vi.mock('../store/tradeStore');
vi.mock('./useAsyncOperation');

describe('usePrice', () => {
  // Mock implementations
  const mockUpdatePrices = vi.fn();
  const mockExecuteSingleFetch = vi.fn();
  const mockExecuteRefreshAll = vi.fn();
  const mockExecuteSymbolRefresh = vi.fn();

  // Sample data
  const mockTrades = [
    { id: '1', symbol: 'AAPL', quantity: 10, price: 150 },
    { id: '2', symbol: 'GOOGL', quantity: 5, price: 2000 },
    { id: '3', symbol: 'AAPL', quantity: 5, price: 155 }, // Duplicate symbol
  ];

  const mockPriceMap = new Map([
    ['AAPL', 160],
    ['GOOGL', 2100],
  ]);

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock useTradeStore
    vi.mocked(useTradeStore).mockImplementation((selector: any) => {
      if (selector) {
        return mockUpdatePrices;
      }
      return {
        trades: mockTrades,
        updatePrices: mockUpdatePrices,
      };
    });

    // Mock useTradeStore.getState()
    vi.mocked(useTradeStore).getState = vi.fn(() => ({
      trades: mockTrades,
      updatePrices: mockUpdatePrices,
    })) as any;

    // Mock useAsyncOperation
    let callCount = 0;
    vi.mocked(useAsyncOperation).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call - for single fetch
        return {
          execute: mockExecuteSingleFetch,
          isLoading: false,
          error: null,
        };
      } else if (callCount === 2) {
        // Second call - for refresh all
        return {
          execute: mockExecuteRefreshAll,
          isLoading: false,
          error: null,
        };
      } else {
        // Third call - for symbol refresh
        return {
          execute: mockExecuteSymbolRefresh,
          isLoading: false,
          error: null,
        };
      }

      
    });

    // Default mock implementations
    mockExecuteSingleFetch.mockImplementation(async (fn) => fn());
    mockExecuteRefreshAll.mockImplementation(async (fn) => fn());
    mockExecuteSymbolRefresh.mockImplementation(async (fn) => fn());


    
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchPrice', () => {
    it('should fetch price successfully', async () => {
      const mockPrice = 150.5;
      vi.mocked(priceService.fetchPrice).mockResolvedValue(mockPrice);

      const { result } = renderHook(() => usePrice());

      let price: number | null = null;
      await act(async () => {
        price = await result.current.fetchPrice('AAPL');
      });

      expect(price).toBe(mockPrice);
      expect(priceService.fetchPrice).toHaveBeenCalledWith('AAPL', false);
      expect(result.current.error).toBeNull();
    });

    it('should handle refresh parameter', async () => {
      const mockPrice = 150.5;
      vi.mocked(priceService.fetchPrice).mockResolvedValue(mockPrice);

      const { result } = renderHook(() => usePrice());

      await act(async () => {
        await result.current.fetchPrice('AAPL', true);
      });

      expect(priceService.fetchPrice).toHaveBeenCalledWith('AAPL', true);
    });

    it('should handle empty symbol', async () => {
      const { result } = renderHook(() => usePrice());

      let price: number | null = null;
      await act(async () => {
        price = await result.current.fetchPrice('');
      });

      expect(price).toBeNull();
      expect(result.current.error).toBe('Invalid symbol');
      expect(priceService.fetchPrice).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only symbol', async () => {
      const { result } = renderHook(() => usePrice());

      let price: number | null = null;
      await act(async () => {
        price = await result.current.fetchPrice('   ');
      });

      expect(price).toBeNull();
      expect(result.current.error).toBe('Invalid symbol');
    });

    it('should handle null price response', async () => {
      vi.mocked(priceService.fetchPrice).mockResolvedValue(null);

      const { result } = renderHook(() => usePrice());

      let price: number | null = null;
      await act(async () => {
        price = await result.current.fetchPrice('INVALID');
      });

      expect(price).toBeNull();
      expect(result.current.error).toBe('Could not fetch price for INVALID');
    });

    it('should handle fetch errors', async () => {
      const error = new Error('Network error');
      mockExecuteSingleFetch.mockRejectedValue(error);

      const { result } = renderHook(() => usePrice());

      let price: number | null = null;
      await act(async () => {
        price = await result.current.fetchPrice('AAPL');
      });

      expect(price).toBeNull();
      expect(result.current.error).toBe('Network error');
    });

    it('should handle non-Error exceptions', async () => {
      mockExecuteSingleFetch.mockRejectedValue('Some string error');

      const { result } = renderHook(() => usePrice());

      let price: number | null = null;
      await act(async () => {
        price = await result.current.fetchPrice('AAPL');
      });

      expect(price).toBeNull();
      expect(result.current.error).toBe('Failed to fetch stock price');
    });
  });

  describe('refreshAllPrices', () => {
    it('should refresh prices for all portfolio symbols', async () => {
      vi.mocked(priceService.fetchBatchPrices).mockResolvedValue(mockPriceMap);

      const { result } = renderHook(() => usePrice());

      await act(async () => {
        await result.current.refreshAllPrices();
      });

      expect(priceService.fetchBatchPrices).toHaveBeenCalledWith(['AAPL', 'GOOGL'], true);
      expect(mockUpdatePrices).toHaveBeenCalledWith(mockPriceMap);
      expect(result.current.error).toBeNull();
    });

    it('should handle empty trades', async () => {
      vi.mocked(useTradeStore).getState = vi.fn(() => ({
        trades: [],
        updatePrices: mockUpdatePrices,
      })) as any;

      const { result } = renderHook(() => usePrice());

      await act(async () => {
        await result.current.refreshAllPrices();
      });

      expect(priceService.fetchBatchPrices).not.toHaveBeenCalled();
      expect(mockUpdatePrices).not.toHaveBeenCalled();
    });

    it('should extract unique symbols only', async () => {
      vi.mocked(priceService.fetchBatchPrices).mockResolvedValue(mockPriceMap);

      const { result } = renderHook(() => usePrice());

      await act(async () => {
        await result.current.refreshAllPrices();
      });

      // Should only call with unique symbols
      expect(priceService.fetchBatchPrices).toHaveBeenCalledWith(['AAPL', 'GOOGL'], true);
    });

it('should handle refresh errors', async () => {
  const error = new Error('Batch fetch failed');
  
  // Mock executeRefreshAll to throw an error when called
  mockExecuteRefreshAll.mockImplementation(async (fn) => {
    try {
      await fn();
    } catch (e) {
      throw e;
    }
  });
  
  // Mock the priceService to throw an error
  vi.mocked(priceService.fetchBatchPrices).mockRejectedValue(error);
  
  // Also need to update the error state from useAsyncOperation
  vi.mocked(useAsyncOperation).mockReset();
  let callCount = 0;
  vi.mocked(useAsyncOperation).mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      return {
        execute: mockExecuteSingleFetch,
        isLoading: false,
        error: null,
      };
    } else if (callCount === 2) {
      // For refresh all - simulate error state after execution
      return {
        execute: mockExecuteRefreshAll,
        isLoading: false,
        error: 'Batch fetch failed',
      };
    } else {
      return {
        execute: mockExecuteSymbolRefresh,
        isLoading: false,
        error: null,
      };
    }
  });

  const { result } = renderHook(() => usePrice());

  await expect(act(async () => {
    await result.current.refreshAllPrices();
  })).rejects.toThrow('Batch fetch failed');

  expect(result.current.error).toBe('Batch fetch failed');
});
    it('should console log the refresh process', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      vi.mocked(priceService.fetchBatchPrices).mockResolvedValue(mockPriceMap);

      const { result } = renderHook(() => usePrice());

      await act(async () => {
        await result.current.refreshAllPrices();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Refreshing prices for 2 symbols...');
      expect(consoleSpy).toHaveBeenCalledWith('Updated prices for 2 symbols');
    });
  });

  describe('refreshSymbolPrices', () => {
    it('should refresh prices for specific symbols', async () => {
      const symbols = ['AAPL', 'TSLA'];
      const specificPriceMap = new Map([
        ['AAPL', 165],
        ['TSLA', 850],
      ]);
      vi.mocked(priceService.fetchBatchPrices).mockResolvedValue(specificPriceMap);

      const { result } = renderHook(() => usePrice());

      let priceMap: Map<string, number> | null = null;
      await act(async () => {
        priceMap = await result.current.refreshSymbolPrices(symbols);
      });

      expect(priceMap).toEqual(specificPriceMap);
      expect(priceService.fetchBatchPrices).toHaveBeenCalledWith(symbols, true);
      expect(mockUpdatePrices).toHaveBeenCalledWith(specificPriceMap);
    });

    it('should handle empty symbols array', async () => {
      const { result } = renderHook(() => usePrice());

      let priceMap: Map<string, number> | null = null;
      await act(async () => {
        priceMap = await result.current.refreshSymbolPrices([]);
      });

      expect(priceMap).toEqual(new Map());
      expect(priceService.fetchBatchPrices).not.toHaveBeenCalled();
    });

    it('should filter out empty symbols', async () => {
      const symbols = ['AAPL', '', '  ', 'TSLA'];
      const cleanedSymbols = ['AAPL', 'TSLA'];
      const priceMap = new Map([
        ['AAPL', 165],
        ['TSLA', 850],
      ]);
      vi.mocked(priceService.fetchBatchPrices).mockResolvedValue(priceMap);

      const { result } = renderHook(() => usePrice());

      await act(async () => {
        await result.current.refreshSymbolPrices(symbols);
      });

      expect(priceService.fetchBatchPrices).toHaveBeenCalledWith(cleanedSymbols, true);
    });

    it('should return empty map if all symbols are empty', async () => {
      const symbols = ['', '  ', '   '];

      const { result } = renderHook(() => usePrice());

      let priceMap: Map<string, number> | null = null;
      await act(async () => {
        priceMap = await result.current.refreshSymbolPrices(symbols);
      });

      expect(priceMap).toEqual(new Map());
      expect(priceService.fetchBatchPrices).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Symbol refresh failed');
      vi.mocked(priceService.fetchBatchPrices).mockRejectedValue(error);

      const { result } = renderHook(() => usePrice());

      let priceMap: Map<string, number> | null = null;
      await act(async () => {
        priceMap = await result.current.refreshSymbolPrices(['AAPL']);
      });

      expect(priceMap).toEqual(new Map());
      expect(result.current.error).toBe('Symbol refresh failed');
    });

    it('should console log the symbols being refreshed', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const symbols = ['AAPL', 'TSLA'];
      vi.mocked(priceService.fetchBatchPrices).mockResolvedValue(new Map());

      const { result } = renderHook(() => usePrice());

      await act(async () => {
        await result.current.refreshSymbolPrices(symbols);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Refreshing prices for symbols: AAPL, TSLA');
    });
  });

  describe('getCachedPrice', () => {
    it('should return cached price', () => {
      const cachedPrice = 175.5;
      vi.mocked(priceService.getCachedPrice).mockReturnValue(cachedPrice);

      const { result } = renderHook(() => usePrice());

      const price = result.current.getCachedPrice('AAPL');

      expect(price).toBe(cachedPrice);
      expect(priceService.getCachedPrice).toHaveBeenCalledWith('AAPL');
    });

    it('should return null for uncached price', () => {
      vi.mocked(priceService.getCachedPrice).mockReturnValue(null);

      const { result } = renderHook(() => usePrice());

      const price = result.current.getCachedPrice('UNKNOWN');

      expect(price).toBeNull();
    });

    it('should handle errors and return null', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();
      vi.mocked(priceService.getCachedPrice).mockImplementation(() => {
        throw new Error('Cache error');
      });

      const { result } = renderHook(() => usePrice());

      const price = result.current.getCachedPrice('AAPL');

      expect(price).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error getting cached price for AAPL:',
        expect.any(Error)
      );
    });
  });

  describe('loading and error states', () => {
    it('should aggregate loading states', () => {
      // Reset mocks to control loading states
      vi.mocked(useAsyncOperation).mockReset();

      let callCount = 0;
      vi.mocked(useAsyncOperation).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { execute: vi.fn(), isLoading: true, error: null };
        } else if (callCount === 2) {
          return { execute: vi.fn(), isLoading: false, error: null };
        } else {
          return { execute: vi.fn(), isLoading: false, error: null };
        }
      });

      const { result } = renderHook(() => usePrice());

      expect(result.current.isLoading).toBe(true);
    });

    it('should aggregate error states', () => {
      // Reset mocks to control error states
      vi.mocked(useAsyncOperation).mockReset();

      let callCount = 0;
      vi.mocked(useAsyncOperation).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { execute: vi.fn(), isLoading: false, error: 'Error 1' };
        } else if (callCount === 2) {
          return { execute: vi.fn(), isLoading: false, error: null };
        } else {
          return { execute: vi.fn(), isLoading: false, error: null };
        }
      });

      const { result } = renderHook(() => usePrice());

      expect(result.current.error).toBe('Error 1');
    });

    it('should prioritize lastError over async operation errors', async () => {
      vi.mocked(useAsyncOperation).mockReset();

      let callCount = 0;
      vi.mocked(useAsyncOperation).mockImplementation(() => {
        callCount++;
        return {
          execute: vi.fn(),
          isLoading: false,
          error: 'Async error',
        };
      });

      const { result } = renderHook(() => usePrice());

      // Trigger an error that sets lastError
      await act(async () => {
        await result.current.fetchPrice('');
      });

      expect(result.current.error).toBe('Invalid symbol');
    });

    it('should clear error on successful operation', async () => {
      const { result } = renderHook(() => usePrice());

      // First, trigger an error
      await act(async () => {
        await result.current.fetchPrice('');
      });

      expect(result.current.error).toBe('Invalid symbol');

      // Then, perform a successful operation
      vi.mocked(priceService.fetchPrice).mockResolvedValue(150);

      await act(async () => {
        await result.current.fetchPrice('AAPL');
      });

      expect(result.current.error).toBeNull();
    });
  });
});