import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import {
  calculateTradeGainPercentage,
  calculatePortfolioValue,
  transformTradesForChart,
} from './calculations';
import type { Trade } from '../types';
import { tradeService } from '../services';

// Mock tradeService methods used in calculations
vi.mock('../services', () => ({
  tradeService: {
    getClosedTrades: vi.fn(),
    calculateGain: vi.fn()
  }
}));

const mockTradeClosed: Trade = {
  id: 't1',
  symbol: 'AAPL',
  quantity: 10,
  buyPrice: 100,
  buyDate: '2025-07-01',
  sellPrice: 150,
  sellDate: '2025-07-10',
};

const mockTradeOpen: Trade = {
  id: 't2',
  symbol: 'GOOG',
  quantity: 5,
  buyPrice: 200,
  buyDate: '2025-07-05',
  sellPrice: undefined,
  sellDate: undefined,
};

describe('calculations.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateTradeGainPercentage', () => {
    it('returns correct percentage for closed trade', () => {
      const result = calculateTradeGainPercentage(mockTradeClosed);
      expect(result).toBe(50); // (150-100)/100 * 100
    });

    it('returns 0 for open trade', () => {
      const result = calculateTradeGainPercentage(mockTradeOpen);
      expect(result).toBe(0);
    });
  });

  describe('calculatePortfolioValue', () => {
    it('calculates value using sellPrice if present', () => {
      const result = calculatePortfolioValue([mockTradeClosed]);
      expect(result).toBe(1500); // 150 * 10
    });

    it('calculates value using buyPrice if sellPrice not present', () => {
      const result = calculatePortfolioValue([mockTradeOpen]);
      expect(result).toBe(1000); // 200 * 5
    });

    it('sums value for mixed trades', () => {
      const result = calculatePortfolioValue([mockTradeClosed, mockTradeOpen]);
      expect(result).toBe(2500); // 1500 + 1000
    });
  });

  describe('transformTradesForChart', () => {
    it('transforms closed trades into sorted chart data', () => {
      (tradeService.getClosedTrades as MockedFunction<typeof tradeService.getClosedTrades>).mockReturnValue([mockTradeClosed]);
      (tradeService.calculateGain as MockedFunction<typeof tradeService.calculateGain>).mockReturnValue(500);

      const result = transformTradesForChart([mockTradeClosed, mockTradeOpen]);

      expect(result).toEqual([
        {
          date: '2025-07-10',
          gain: 500,
          symbol: 'AAPL',
        },
      ]);

      expect(tradeService.getClosedTrades).toHaveBeenCalledWith([mockTradeClosed, mockTradeOpen]);
      expect(tradeService.calculateGain).toHaveBeenCalledWith(mockTradeClosed);
    });

    it('sorts transformed trades by date', () => {
      const t1 = { ...mockTradeClosed, sellDate: '2025-07-20', symbol: 'X' };
      const t2 = { ...mockTradeClosed, sellDate: '2025-07-01', symbol: 'Y' };

      (tradeService.getClosedTrades as MockedFunction<typeof tradeService.getClosedTrades>).mockReturnValue([t1, t2]);
      (tradeService.calculateGain as MockedFunction<typeof tradeService.calculateGain>).mockImplementation((t: Trade) =>
        t.symbol === 'X' ? 100 : 200
      );

      const result = transformTradesForChart([t1, t2]);
      expect(result).toEqual([
        { date: '2025-07-01', gain: 200, symbol: 'Y' },
        { date: '2025-07-20', gain: 100, symbol: 'X' }
      ]);
    });
  });
});
