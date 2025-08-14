import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStockPrice } from './useStockPrice';
import { priceService } from '../services';
import { useAsyncOperation } from './useAsyncOperation';

//TURN 2 BASE

// Mock the dependencies
vi.mock('../services', () => ({
  priceService: {
    fetchPrice: vi.fn(),
    fetchBatchPrices: vi.fn(),
    getCachedPrice: vi.fn(),
    clearPriceCache: vi.fn(),
  },
}));

vi.mock('./useAsyncOperation', () => ({
  useAsyncOperation: vi.fn(),
}));

describe('useStockPrice', () => {
  // Mock implementations for useAsyncOperation
  const mockExecuteFetchPrice = vi.fn();
  const mockExecuteBatchFetch = vi.fn();
  
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Setup default mock implementation for useAsyncOperation
    vi.mocked(useAsyncOperation).mockImplementation(() => ({
      execute: mockExecuteFetchPrice,
      isLoading: false,
      error: null,
      data: null,
    }));
    
    // Make execute functions return different mocks on subsequent calls
    vi.mocked(useAsyncOperation)
      .mockReturnValueOnce({
        execute: mockExecuteFetchPrice,
        isLoading: false,
        error: null,
        data: null,
      })
      .mockReturnValueOnce({
        execute: mockExecuteBatchFetch,
        isLoading: false,
        error: null,
        data: null,
      });
      
    // Setup default implementations for execute functions
    mockExecuteFetchPrice.mockImplementation(async (fn) => {
      return await fn();
    });
    
    mockExecuteBatchFetch.mockImplementation(async (fn) => {
      return await fn();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchPrice', () => {
    it('should fetch price successfully', async () => {
      const mockPrice = 150.50;
      vi.mocked(priceService.fetchPrice).mockResolvedValue(mockPrice);

      const { result } = renderHook(() => useStockPrice());

      let price: number | null = null;
      await act(async () => {
        price = await result.current.fetchPrice('AAPL');
      });

      expect(price).toBe(mockPrice);
      expect(priceService.fetchPrice).toHaveBeenCalledWith('AAPL', false);
      expect(result.current.error).toBeNull();
    });

    it('should fetch price with refresh flag', async () => {
      const mockPrice = 155.75;
      vi.mocked(priceService.fetchPrice).mockResolvedValue(mockPrice);

      const { result } = renderHook(() => useStockPrice());

      await act(async () => {
        await result.current.fetchPrice('AAPL', true);
      });

      expect(priceService.fetchPrice).toHaveBeenCalledWith('AAPL', true);
    });

    it('should handle empty symbol', async () => {
      const { result } = renderHook(() => useStockPrice());

      let price: number | null = null;
      await act(async () => {
        price = await result.current.fetchPrice('');
      });

      expect(price).toBeNull();
      expect(result.current.error).toBe('Invalid symbol');
      expect(priceService.fetchPrice).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only symbol', async () => {
      const { result } = renderHook(() => useStockPrice());

      let price: number | null = null;
      await act(async () => {
        price = await result.current.fetchPrice('   ');
      });

      expect(price).toBeNull();
      expect(result.current.error).toBe('Invalid symbol');
      expect(priceService.fetchPrice).not.toHaveBeenCalled();
    });

    it('should handle fetch error', async () => {
      const errorMessage = 'Network error';
      vi.mocked(priceService.fetchPrice).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useStockPrice());

      let price: number | null = null;
      await act(async () => {
        price = await result.current.fetchPrice('AAPL');
      });

      expect(price).toBeNull();
      expect(result.current.error).toBe(errorMessage);
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(priceService.fetchPrice).mockRejectedValue('String error');

      const { result } = renderHook(() => useStockPrice());

      let price: number | null = null;
      await act(async () => {
        price = await result.current.fetchPrice('AAPL');
      });

      expect(price).toBeNull();
      expect(result.current.error).toBe('Failed to fetch price');
    });

    it('should return null when service returns undefined', async () => {
      vi.mocked(priceService.fetchPrice).mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useStockPrice());

      let price: number | null = null;
      await act(async () => {
        price = await result.current.fetchPrice('AAPL');
      });

      expect(price).toBeNull();
    });
  });

  describe('fetchBatchPrices', () => {
    it('should fetch batch prices successfully', async () => {
      const mockPrices = new Map([
        ['AAPL', 150.50],
        ['GOOGL', 2800.25],
        ['MSFT', 380.75],
      ]);
      vi.mocked(priceService.fetchBatchPrices).mockResolvedValue(mockPrices);

      const { result } = renderHook(() => useStockPrice());

      let prices: Map<string, number> = new Map();
      await act(async () => {
        prices = await result.current.fetchBatchPrices(['AAPL', 'GOOGL', 'MSFT']);
      });

      expect(prices).toEqual(mockPrices);
      expect(priceService.fetchBatchPrices).toHaveBeenCalledWith(['AAPL', 'GOOGL', 'MSFT'], false);
      expect(result.current.error).toBeNull();
    });

    it('should handle empty symbols array', async () => {
      const { result } = renderHook(() => useStockPrice());

      let prices: Map<string, number> = new Map();
      await act(async () => {
        prices = await result.current.fetchBatchPrices([]);
      });

      expect(prices.size).toBe(0);
      expect(priceService.fetchBatchPrices).not.toHaveBeenCalled();
    });

    it('should handle batch fetch error', async () => {
      const errorMessage = 'Batch fetch failed';
      vi.mocked(priceService.fetchBatchPrices).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useStockPrice());

      let prices: Map<string, number> = new Map();
      await act(async () => {
        prices = await result.current.fetchBatchPrices(['AAPL', 'GOOGL']);
      });

      expect(prices.size).toBe(0);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should return empty map when service returns undefined', async () => {
      vi.mocked(priceService.fetchBatchPrices).mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useStockPrice());

      let prices: Map<string, number> = new Map();
      await act(async () => {
        prices = await result.current.fetchBatchPrices(['AAPL']);
      });

      expect(prices.size).toBe(0);
    });
  });

  describe('getCachedPrice', () => {
    it('should get cached price successfully', () => {
      const mockPrice = 150.50;
      vi.mocked(priceService.getCachedPrice).mockReturnValue(mockPrice);

      const { result } = renderHook(() => useStockPrice());

      const price = result.current.getCachedPrice('AAPL');

      expect(price).toBe(mockPrice);
      expect(priceService.getCachedPrice).toHaveBeenCalledWith('AAPL');
    });

    it('should return null when no cached price exists', () => {
      vi.mocked(priceService.getCachedPrice).mockReturnValue(null);

      const { result } = renderHook(() => useStockPrice());

      const price = result.current.getCachedPrice('AAPL');

      expect(price).toBeNull();
    });

    it('should handle cache retrieval error', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(priceService.getCachedPrice).mockImplementation(() => {
        throw new Error('Cache error');
      });

      const { result } = renderHook(() => useStockPrice());

      const price = result.current.getCachedPrice('AAPL');

      expect(price).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error getting cached price for AAPL:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('clearCache', () => {
    it('should clear all cache', () => {
      const { result } = renderHook(() => useStockPrice());

      act(() => {
        result.current.clearCache();
      });

      expect(priceService.clearPriceCache).toHaveBeenCalledWith(undefined);
    });

    it('should clear specific symbol cache', () => {
      const { result } = renderHook(() => useStockPrice());

      act(() => {
        result.current.clearCache('AAPL');
      });

      expect(priceService.clearPriceCache).toHaveBeenCalledWith('AAPL');
    });

    it('should handle cache clear error', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(priceService.clearPriceCache).mockImplementation(() => {
        throw new Error('Clear cache error');
      });

      const { result } = renderHook(() => useStockPrice());

      act(() => {
        result.current.clearCache();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error clearing price cache:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

describe('loading states', () => {
  it('should reflect fetchPrice loading state', () => {
    // Clear the default mock setup
    vi.mocked(useAsyncOperation).mockReset();
    
    // Set up the mock for this specific test
    vi.mocked(useAsyncOperation)
      .mockReturnValueOnce({
        execute: mockExecuteFetchPrice,
        isLoading: true,  // First call - fetchPrice is loading
        error: null,
        data: null,
      })
      .mockReturnValueOnce({
        execute: mockExecuteBatchFetch,
        isLoading: false, // Second call - batch is not loading
        error: null,
        data: null,
      });

    const { result } = renderHook(() => useStockPrice());

    expect(result.current.isLoading).toBe(true);
  });

  it('should reflect batch loading state', () => {
    // Clear the default mock setup
    vi.mocked(useAsyncOperation).mockReset();
    
    vi.mocked(useAsyncOperation)
      .mockReturnValueOnce({
        execute: mockExecuteFetchPrice,
        isLoading: false,
        error: null,
        data: null,
      })
      .mockReturnValueOnce({
        execute: mockExecuteBatchFetch,
        isLoading: true,  // Batch is loading
        error: null,
        data: null,
      });

    const { result } = renderHook(() => useStockPrice());

    expect(result.current.isLoading).toBe(true);
  });

  it('should be true when both operations are loading', () => {
    // Clear the default mock setup
    vi.mocked(useAsyncOperation).mockReset();
    
    vi.mocked(useAsyncOperation)
      .mockReturnValueOnce({
        execute: mockExecuteFetchPrice,
        isLoading: true,
        error: null,
        data: null,
      })
      .mockReturnValueOnce({
        execute: mockExecuteBatchFetch,
        isLoading: true,
        error: null,
        data: null,
      });

    const { result } = renderHook(() => useStockPrice());

    expect(result.current.isLoading).toBe(true);
  });
});
describe('error states', () => {
  it('should prioritize lastError over async errors', async () => {
    const { result } = renderHook(() => useStockPrice());

    await act(async () => {
      await result.current.fetchPrice('');
    });

    expect(result.current.error).toBe('Invalid symbol');
  });

  it('should show fetchPrice error when no lastError', () => {
    const fetchError = 'Fetch price error';
    
    // Clear the default mock setup
    vi.mocked(useAsyncOperation).mockReset();
    
    // Set up the mock for this specific test
    vi.mocked(useAsyncOperation)
      .mockReturnValueOnce({
        execute: mockExecuteFetchPrice,
        isLoading: false,
        error: fetchError,  // fetchPrice has an error
        data: null,
      })
      .mockReturnValueOnce({
        execute: mockExecuteBatchFetch,
        isLoading: false,
        error: null,       // batch has no error
        data: null,
      });

    const { result } = renderHook(() => useStockPrice());

    expect(result.current.error).toBe(fetchError);
  });

  it('should show batch error when no other errors', () => {
    const batchError = 'Batch error';
    
    // Clear the default mock setup
    vi.mocked(useAsyncOperation).mockReset();
    
    vi.mocked(useAsyncOperation)
      .mockReturnValueOnce({
        execute: mockExecuteFetchPrice,
        isLoading: false,
        error: null,       // fetchPrice has no error
        data: null,
      })
      .mockReturnValueOnce({
        execute: mockExecuteBatchFetch,
        isLoading: false,
        error: batchError, // batch has an error
        data: null,
      });

    const { result } = renderHook(() => useStockPrice());

    expect(result.current.error).toBe(batchError);
  });

  it('should clear lastError on successful operations', async () => {
    vi.mocked(priceService.fetchPrice).mockResolvedValue(150.50);

    const { result } = renderHook(() => useStockPrice());

    // First create an error
    await act(async () => {
      await result.current.fetchPrice('');
    });
    expect(result.current.error).toBe('Invalid symbol');

    // Then perform successful operation
    await act(async () => {
      await result.current.fetchPrice('AAPL');
    });
    expect(result.current.error).toBeNull();
  });
});
});