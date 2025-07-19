// src/utils/calculateGain.test.ts
import { describe, expect, it } from 'vitest';
import { calculateGain } from './calculateGain';

const mockTrade = {
  id: '1',
  symbol: 'AAPL',
  quantity: 10,
  buyPrice: 100,
  sellPrice: 120,
  buyDate: '2025-07-01',
  sellDate: '2025-07-10',
};

describe('calculateGain', () => {
  it('should calculate correct gain', () => {
    expect(calculateGain(mockTrade)).toBe(200);
  });

  it('should return 0 if no sellPrice', () => {
    const tradeWithoutSell = { ...mockTrade, sellPrice: undefined };
    expect(calculateGain(tradeWithoutSell)).toBe(0);
  });
});
