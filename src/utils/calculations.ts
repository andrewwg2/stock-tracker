import type { Trade, TradeGainData } from '../types';
import { tradeService } from '../services';

export function calculateTradeGainPercentage(trade: Trade): number {
  if (!trade.sellPrice) return 0;
  return ((trade.sellPrice - trade.buyPrice) / trade.buyPrice) * 100;
}

export function calculatePortfolioValue(trades: Trade[]): number {
  return trades.reduce((total, trade) => {
    const value = trade.sellPrice ? 
      trade.sellPrice * trade.quantity : 
      trade.buyPrice * trade.quantity;
    return total + value;
  }, 0);
}

export function transformTradesForChart(trades: Trade[]): TradeGainData[] {
  const closedTrades = tradeService.getClosedTrades(trades);
  
  return closedTrades
    .map(trade => ({
      date: trade.sellDate!,
      gain: tradeService.calculateGain(trade),
      symbol: trade.symbol
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
