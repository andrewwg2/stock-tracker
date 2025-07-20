/**
 * Calculations Utilities Tests
 */

import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';
import {
  calculateTradeGainPercentage,
  calculatePortfolioValue,
  calculateTotalGain,
  calculateUnrealizedGain,
  transformTradesForChart,
  calculateSharpeRatio,
} from './calculations';
import type { Trade, TradeDTO } from '../types';

const mockTradeClosed: Trade = {
  id: 't1',
  symbol: 'AAPL',
  quantity: 10,
  buyPrice: 100,
  buyDate: '2025-01-01',
  sellPrice: 150,
  sellDate: '2025-01-10',
};

const mockTradeClosedDTO: TradeDTO = {
  ...mockTradeClosed,
  gain: 500,
  gainPercentage: 50,
  isOpen: false,
  currentValue: 1500,
};

const mockTradeOpen: Trade = {
  id: 't2',
  symbol: 'GOOG',
  quantity: 5,
  buyPrice: 200,
  buyDate: '2025-01-05',
};

const mockTradeOpenDTO: TradeDTO = {
  ...mockTradeOpen,
  gain: 0,
  gainPercentage: 0,
  isOpen: true,
  currentValue: 1000,
};

describe('calculations utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateTradeGainPercentage', () => {
    it('calculates correct percentage for closed trade', () => {
      const result = calculateTradeGainPercentage(mockTradeClosed);
      expect(result).toBe(50); // (150-100)/100 * 100
    });

    it('returns 0 for open trade', () => {
      const result = calculateTradeGainPercentage(mockTradeOpen);
      expect(result).toBe(0);
    });

    it('handles negative gains', () => {
      const losingTrade = { ...mockTradeClosed, sellPrice: 80 };
      const result = calculateTradeGainPercentage(losingTrade);
      expect(result).toBe(-20); // (80-100)/100 * 100
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

    it('handles empty array', () => {
      const result = calculatePortfolioValue([]);
      expect(result).toBe(0);
    });
  });

  describe('calculateTotalGain', () => {
    it('calculates total realized gain from closed trades', () => {
      const result = calculateTotalGain([mockTradeClosed]);
      expect(result).toBe(500); // (150-100) * 10
    });

    it('ignores open trades', () => {
      const result = calculateTotalGain([mockTradeOpen]);
      expect(result).toBe(0);
    });

    it('sums gains from multiple closed trades', () => {
      const trade2 = { ...mockTradeClosed, id: 't2', sellPrice: 90, quantity: 5 };
      const result = calculateTotalGain([mockTradeClosed, trade2]);
      expect(result).toBe(450); // 500 + (-50)
    });
  });

  describe('calculateUnrealizedGain', () => {
    it('calculates unrealized gains for open positions', () => {
      const currentPrices = new Map([['GOOG', 250]]);
      const result = calculateUnrealizedGain([mockTradeOpen], currentPrices);
      expect(result).toBe(250); // (250-200) * 5
    });

    it('ignores closed trades', () => {
      const currentPrices = new Map([['AAPL', 200]]);
      const result = calculateUnrealizedGain([mockTradeClosed], currentPrices);
      expect(result).toBe(0);
    });

    it('handles missing price data', () => {
      const currentPrices = new Map();
      const result = calculateUnrealizedGain([mockTradeOpen], currentPrices);
      expect(result).toBe(0);
    });
  });

  describe('transformTradesForChart', () => {
    it('transforms closed trades into chart data', () => {
      const result = transformTradesForChart([mockTradeClosed, mockTradeOpen]);
      
      expect(result).toEqual([
        {
          date: '2025-01-10',
          gain: 500,
          symbol: 'AAPL',
        },
      ]);
    });

    it('sorts trades by date', () => {
      const trade1 = { ...mockTradeClosed, sellDate: '2025-01-20', symbol: 'X' };
      const trade2 = { ...mockTradeClosed, sellDate: '2025-01-01', symbol: 'Y' };
      
      const result = transformTradesForChart([trade1, trade2]);
      
      expect(result[0].date).toBe('2025-01-01');
      expect(result[1].date).toBe('2025-01-20');
    });

    it('handles empty array', () => {
      const result = transformTradesForChart([]);
      expect(result).toEqual([]);
    });
  });

  describe('calculateSharpeRatio', () => {
    it('calculates Sharpe ratio correctly', () => {
      const gains = [0.1, 0.2, -0.05, 0.15, 0.08];
      const result = calculateSharpeRatio(gains, 0.02);
      
      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
    });

    it('returns 0 for empty gains array', () => {
      const result = calculateSharpeRatio([]);
      expect(result).toBe(0);
    });

    it('returns 0 when standard deviation is 0', () => {
      const gains = [0.1, 0.1, 0.1, 0.1];
      const result = calculateSharpeRatio(gains);
      expect(result).toBe(0);
    });
  });
});
