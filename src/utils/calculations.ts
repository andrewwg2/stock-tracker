/**
 * Financial calculation utilities
 */

import type { Trade, TradeGainData, TradeDTO } from '../types';

/**
 * Calculates gain percentage for a trade
 * @param trade The trade to calculate percentage for
 * @returns Gain percentage (positive or negative)
 */
export const calculateTradeGainPercentage = (trade: Trade | TradeDTO): number => {
  if (!trade.sellPrice) {
    return 0;
  }
  
  return ((trade.sellPrice - trade.buyPrice) / trade.buyPrice) * 100;
};

/**
 * Calculates the total portfolio value
 * @param trades Array of trades
 * @returns Total portfolio value
 */
export const calculatePortfolioValue = (trades: (Trade | TradeDTO)[]): number => {
  return trades.reduce((total, trade) => {
    const value = trade.sellPrice
      ? trade.sellPrice * trade.quantity
      : trade.buyPrice * trade.quantity;
    return total + value;
  }, 0);
};

/**
 * Calculates the total gain from an array of trades
 * @param trades Array of trades
 * @returns Total gain amount
 */
export const calculateTotalGain = (trades: (Trade | TradeDTO)[]): number => {
  return trades.reduce((total, trade) => {
    if (!trade.sellPrice) {
      return total;
    }
    const gain = (trade.sellPrice - trade.buyPrice) * trade.quantity;
    return total + gain;
  }, 0);
};

/**
 * Calculates the average buy price for an array of trades
 * @param trades Array of trades
 * @returns Average buy price
 */
export const calculateAverageBuyPrice = (trades: (Trade | TradeDTO)[]): number => {
  if (trades.length === 0) {
    return 0;
  }
  
  const totalValue = trades.reduce((sum, trade) => sum + (trade.buyPrice * trade.quantity), 0);
  const totalQuantity = trades.reduce((sum, trade) => sum + trade.quantity, 0);
  
  return totalQuantity > 0 ? totalValue / totalQuantity : 0;
};

/**
 * Calculates unrealized gain for open positions
 * @param trades Array of open trades
 * @param currentPrices Map of current prices by symbol
 * @returns Total unrealized gain
 */
export const calculateUnrealizedGain = (
  trades: (Trade | TradeDTO)[],
  currentPrices: Map<string, number>
): number => {
  return trades
    .filter(trade => !trade.sellPrice)
    .reduce((total, trade) => {
      const currentPrice = currentPrices.get(trade.symbol);
      if (!currentPrice) {
        return total;
      }
      
      const currentValue = currentPrice * trade.quantity;
      const buyValue = trade.buyPrice * trade.quantity;
      return total + (currentValue - buyValue);
    }, 0);
};

/**
 * Transforms trades data for chart visualization
 * @param trades Array of trades
 * @returns Chart data array sorted by date
 */
export const transformTradesForChart = (trades: (Trade | TradeDTO)[]): TradeGainData[] => {
  const closedTrades = trades.filter(trade => trade.sellPrice && trade.sellDate);
  
  return closedTrades
    .map(trade => ({
      date: trade.sellDate!,
      gain: (trade.sellPrice! - trade.buyPrice) * trade.quantity,
      symbol: trade.symbol,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Calculates the Sharpe ratio for a portfolio
 * @param gains Array of gain values
 * @param riskFreeRate Risk-free rate (default: 0.02 for 2%)
 * @returns Sharpe ratio
 */
export const calculateSharpeRatio = (gains: number[], riskFreeRate: number = 0.02): number => {
  if (gains.length === 0) {
    return 0;
  }
  
  const meanReturn = gains.reduce((sum, gain) => sum + gain, 0) / gains.length;
  const variance = gains.reduce((sum, gain) => sum + Math.pow(gain - meanReturn, 2), 0) / gains.length;
  const standardDeviation = Math.sqrt(variance);
  
  if (standardDeviation === 0) {
    return 0;
  }
  
  return (meanReturn - riskFreeRate) / standardDeviation;
};
