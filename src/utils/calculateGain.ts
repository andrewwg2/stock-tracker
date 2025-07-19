// src/utils/calculateGain.ts
import type { Trade } from '../types';

export function calculateGain(trade: Trade): number {
  if (!trade.sellPrice) return 0;
  return (trade.sellPrice - trade.buyPrice) * trade.quantity;
}
