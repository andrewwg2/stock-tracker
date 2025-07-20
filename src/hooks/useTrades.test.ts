/**
 * useTrades Hook Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTrades } from './useTrades';
import type { TradeDTO, CreateTradeDTO } from '../dto';

// Mock the trade store
const mockTradeStore = {
  trades: [],
  filteredList: null,
  isLoading: false,
  error: null,
  initialize: vi.fn(),
  addTrade: vi.fn(),
  sellTrade: vi.fn(),
  clearAllTrades: vi.fn(),
  filterTrades: vi.fn(),
};

// Mock the price hook
const mockPriceHook = {
  refreshAllPrices: vi.fn(),
  isLoading: false,
  error: null,
};

vi.mock('../store/tradeStore', () => ({
  useTradeStore: vi.fn(() => mockTradeStore),
}));

vi.mock('./usePrice', () => ({
  usePrice: vi.fn(() => mockPriceHook),
}));

const sampleTrade: TradeDTO = {
  id: 'test-id',
  symbol: 'TSLA',
  quantity: 10,
  buyPrice: 250,
  buyDate: '2025-01-17',
  sellPrice: 280,
  sellDate: '2025-01-18',
  gain: 300,
  gainPercentage: 12,
  isOpen: false,
  currentValue: 2800,
};

describe('useTrades hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock store state
    mockTradeStore.trades = [];
    mockTradeStore.filteredList = null;
    mockTradeStore.isLoading = false;
    mockTradeStore.error = null;
    
    // Reset mock price hook state
    mockPriceHook.isLoading = false;
    mockPriceHook.error = null;
  });

  it('should initialize on mount', () => {
    const { result } = renderHook(() => useTrades());
    
    expect(mockTradeStore.initialize).toHaveBeenCalled();
    expect(result.current.trades).toEqual([]);
  });

  it('should return trades from filtered list when available', () => {
    mockTradeStore.filteredList = {
      trades: [sampleTrade],
      totalCount: 1,
      totalValue: 2800,
      totalGain: 300,
      openPositions: 0,
      closedPositions: 1,
    };

    const { result } = renderHook(() => useTrades());
    
    expect(result.current.trades).toEqual([sampleTrade]);
    expect(result.current.tradesList).toBeTruthy();
  });

  it('should fallback to store trades when no filtered list', () => {
    mockTradeStore.trades = [sampleTrade];
    mockTradeStore.filteredList = null;

    const { result } = renderHook(() => useTrades());
    
    expect(result.current.trades).toEqual([sampleTrade]);
  });

  it('should handle add trade', async () => {
    const createDTO: CreateTradeDTO = {
      symbol: 'TSLA',
      quantity: 10,
      buyPrice: 250,
    };

    const { result } = renderHook(() => useTrades());

    await act(async () => {
      await result.current.addTrade(createDTO);
    });

    expect(mockTradeStore.addTrade).toHaveBeenCalledWith(createDTO);
  });

  it('should handle sell trade', async () => {
    const { result } = renderHook(() => useTrades());

    await act(async () => {
      await result.current.sellTrade('test-id', 280);
    });

    expect(mockTradeStore.sellTrade).toHaveBeenCalledWith('test-id', 280);
  });

  it('should handle clear all trades', async () => {
    const { result } = renderHook(() => useTrades());

    await act(async () => {
      await result.current.clearAllTrades();
    });

    expect(mockTradeStore.clearAllTrades).toHaveBeenCalled();
  });

  it('should handle refresh prices', async () => {
    const { result } = renderHook(() => useTrades());

    await act(async () => {
      await result.current.refreshPrices();
    });

    expect(mockPriceHook.refreshAllPrices).toHaveBeenCalled();
  });

  it('should combine loading states', () => {
    mockTradeStore.isLoading = true;
    mockPriceHook.isLoading = false;

    const { result } = renderHook(() => useTrades());
    
    expect(result.current.isLoading).toBe(true);
  });

  it('should combine error states', () => {
    mockTradeStore.error = 'Store error';
    mockPriceHook.error = null;

    const { result } = renderHook(() => useTrades());
    
    expect(result.current.error).toBe('Store error');
  });

  it('should calculate computed values correctly', () => {
    mockTradeStore.trades = [
      { ...sampleTrade, sellPrice: undefined, sellDate: undefined, isOpen: true },
      sampleTrade,
    ];

    const { result } = renderHook(() => useTrades());
    
    expect(result.current.totalTrades).toBe(2);
    expect(result.current.hasOpenPositions).toBe(true);
    expect(result.current.openPositions).toBe(1);
    expect(result.current.closedPositions).toBe(1);
  });

  it('should handle errors gracefully', async () => {
    const error = new Error('Test error');
    mockTradeStore.addTrade.mockRejectedValue(error);

    const { result } = renderHook(() => useTrades());

    await act(async () => {
      try {
        await result.current.addTrade({
          symbol: 'TSLA',
          quantity: 10,
          buyPrice: 250,
        });
      } catch (e) {
        // Expected to throw
      }
    });

    expect(mockTradeStore.addTrade).toHaveBeenCalled();
  });
});
