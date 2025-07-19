import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTrades } from './useTrades';
import type { TradeDTO, CreateTradeDTO } from '../dto';
import { storageService, tradeService } from '../services';

vi.mock('../services', async () => {
  const actual = await vi.importActual<typeof import('../services')>('../services');
  return {
    ...actual,
    storageService: {
      ...actual.storageService,
      loadTrades: vi.fn(),
      getTradeById: vi.fn(),
      saveTradeDTO: vi.fn(),
      updateTradeDTO: vi.fn(),
      deleteTradeById: vi.fn(),
      clearTrades: vi.fn()
    },
    tradeService: {
      ...actual.tradeService,
      createTradeFromDTO: vi.fn(),
      updateTrade: vi.fn(),
      getTradesWithFilter: vi.fn()
    }
  };
});

const sampleTrade: TradeDTO = {
  id: 'test-id',
  symbol: 'TSLA',
  quantity: 10,
  buyPrice: 250,
  buyDate: '2025-07-17',
  sellPrice: 280,
  sellDate: '2025-07-18',
};

describe('useTrades', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty trades when localStorage is empty', () => {
    (storageService.loadTrades as vi.Mock).mockReturnValue([]);
    (storageService.getTradeById as vi.Mock).mockImplementation(() => undefined);
    (tradeService.getTradesWithFilter as vi.Mock).mockReturnValue({ trades: [], totalCount: 0, totalValue: 0, totalGain: 0 });

    const { result } = renderHook(() => useTrades());
    expect(result.current.trades).toEqual([]);
    expect(result.current.tradesList?.trades).toEqual([]);
  });

  it('should load trades from storage on mount', () => {
    (storageService.loadTrades as vi.Mock).mockReturnValue([sampleTrade]);
    (storageService.getTradeById as vi.Mock).mockReturnValue(sampleTrade);
    (tradeService.getTradesWithFilter as vi.Mock).mockReturnValue({ trades: [sampleTrade], totalCount: 1, totalValue: 2500, totalGain: 300 });

    const { result } = renderHook(() => useTrades());

    expect(result.current.trades.length).toBe(1);
    expect(result.current.trades[0]).toEqual(sampleTrade);
    expect(result.current.tradesList?.trades.length).toBe(1);
  });

  it('should add a trade and refresh state', () => {
    const createDTO: CreateTradeDTO = {
      symbol: 'TSLA',
      quantity: 10,
      buyPrice: 250
    };

    const createdTrade: TradeDTO = {
      id: 'new-id',
      symbol: 'TSLA',
      quantity: 10,
      buyPrice: 250,
      buyDate: '2025-07-17'
    };

    (storageService.loadTrades as vi.Mock).mockReturnValue([]);
    (tradeService.createTradeFromDTO as vi.Mock).mockReturnValue(createdTrade);
    (storageService.getTradeById as vi.Mock).mockReturnValue(createdTrade);
    (tradeService.getTradesWithFilter as vi.Mock).mockReturnValue({ trades: [createdTrade], totalCount: 1, totalValue: 2500, totalGain: 0 });

    const { result } = renderHook(() => useTrades());

    act(() => {
      result.current.addTrade(createDTO);
    });

    expect(storageService.saveTradeDTO).toHaveBeenCalledWith(createdTrade);
    expect(result.current.trades.length).toBe(1);
    expect(result.current.trades[0]).toEqual(createdTrade);
  });

  it('should clear all trades', () => {
    (storageService.loadTrades as vi.Mock).mockReturnValue([sampleTrade]);
    (storageService.getTradeById as vi.Mock).mockReturnValue(sampleTrade);
    (tradeService.getTradesWithFilter as vi.Mock).mockReturnValue({ trades: [sampleTrade], totalCount: 1, totalValue: 2500, totalGain: 300 });

    const { result } = renderHook(() => useTrades());

    act(() => {
      result.current.clearAllTrades();
    });

    expect(storageService.clearTrades).toHaveBeenCalled();
    expect(result.current.trades).toEqual([]);
    expect(result.current.tradesList?.trades).toEqual([]);
  });
});
