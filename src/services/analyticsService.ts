/**
 * Analytics Service
 * Provides advanced analytics and performance metrics for trades
 */

import type { TradeDTO, TradeGainDTO, PortfolioPerformanceDTO, SymbolPerformanceDTO } from '../dto';
import { calculateSharpeRatio, transformTradesForChart } from '../utils';

export interface AnalyticsService {
  // Portfolio analytics
  getPortfolioPerformance(trades: TradeDTO[]): PortfolioPerformanceDTO;
  getSymbolPerformance(trades: TradeDTO[]): SymbolPerformanceDTO[];
  getPerformanceOverTime(trades: TradeDTO[]): TradeGainDTO[];
  
  // Risk metrics
  calculateVolatility(returns: number[]): number;
  calculateMaxDrawdown(values: number[]): number;
  calculateBeta(portfolioReturns: number[], marketReturns?: number[]): number;
  
  // Performance comparison
  calculateOutperformance(portfolioReturn: number, benchmarkReturn: number): number;
  getWinRate(trades: TradeDTO[]): number;
  getAverageHoldingPeriod(trades: TradeDTO[]): number;
  
  // Insights
  getBestPerformingSymbols(trades: TradeDTO[], limit?: number): SymbolPerformanceDTO[];
  getWorstPerformingSymbols(trades: TradeDTO[], limit?: number): SymbolPerformanceDTO[];
  getTradingInsights(trades: TradeDTO[]): Record<string, any>;
}

class AnalyticsServiceImpl implements AnalyticsService {
  getPortfolioPerformance(trades: TradeDTO[]): PortfolioPerformanceDTO {
    if (trades.length === 0) {
      return this.createEmptyPerformance();
    }

    const totalInvestment = trades.reduce((sum, trade) => 
      sum + (trade.buyPrice * trade.quantity), 0);

    const currentValue = trades.reduce((sum, trade) => {
      if (trade.sellPrice) {
        return sum + (trade.sellPrice * trade.quantity);
      }
      return sum + (trade.currentValue || trade.buyPrice * trade.quantity);
    }, 0);

    const totalGain = currentValue - totalInvestment;
    const gainPercentage = totalInvestment > 0 ? (totalGain / totalInvestment) * 100 : 0;

    const openTrades = trades.filter(trade => trade.isOpen);
    const closedTrades = trades.filter(trade => !trade.isOpen);

    const realizedGain = closedTrades.reduce((sum, trade) => sum + (trade.gain || 0), 0);
    const unrealizedGain = openTrades.reduce((sum, trade) => sum + (trade.gain || 0), 0);

    return {
      totalInvestment,
      currentValue,
      totalGain,
      gainPercentage,
      tradeCount: trades.length,
      openTradeCount: openTrades.length,
      closedTradeCount: closedTrades.length,
      realizedGain,
      unrealizedGain,
    };
  }

  getSymbolPerformance(trades: TradeDTO[]): SymbolPerformanceDTO[] {
    const symbolMap = new Map<string, TradeDTO[]>();

    // Group trades by symbol
    trades.forEach(trade => {
      const existing = symbolMap.get(trade.symbol) || [];
      existing.push(trade);
      symbolMap.set(trade.symbol, existing);
    });

    const symbolPerformances: SymbolPerformanceDTO[] = [];

    symbolMap.forEach((symbolTrades, symbol) => {
      const investment = symbolTrades.reduce((sum, trade) => 
        sum + (trade.buyPrice * trade.quantity), 0);

      const currentValue = symbolTrades.reduce((sum, trade) => {
        if (trade.sellPrice) {
          return sum + (trade.sellPrice * trade.quantity);
        }
        return sum + (trade.currentValue || trade.buyPrice * trade.quantity);
      }, 0);

      const gain = currentValue - investment;
      const gainPercentage = investment > 0 ? (gain / investment) * 100 : 0;
      const averageHoldingPeriod = this.calculateAverageHoldingPeriodForSymbol(symbolTrades);
      const winningTrades = symbolTrades.filter(trade => (trade.gain || 0) > 0).length;
      const totalTrades = symbolTrades.filter(trade => trade.sellPrice).length;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

      symbolPerformances.push({
        symbol,
        investment,
        currentValue,
        gain,
        gainPercentage,
        tradeCount: symbolTrades.length,
        averageHoldingPeriod,
        winRate,
      });
    });

    return symbolPerformances.sort((a, b) => b.gainPercentage - a.gainPercentage);
  }

  getPerformanceOverTime(trades: TradeDTO[]): TradeGainDTO[] {
    return transformTradesForChart(trades);
  }

  calculateVolatility(returns: number[]): number {
    if (returns.length < 2) {
      return 0;
    }

    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (returns.length - 1);
    
    return Math.sqrt(variance);
  }

  calculateMaxDrawdown(values: number[]): number {
    if (values.length < 2) {
      return 0;
    }

    let maxDrawdown = 0;
    let peak = values[0];

    for (let i = 1; i < values.length; i++) {
      if (values[i] > peak) {
        peak = values[i];
      } else {
        const drawdown = (peak - values[i]) / peak;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    }

    return maxDrawdown * 100; // Return as percentage
  }

  calculateBeta(portfolioReturns: number[], marketReturns: number[] = []): number {
    if (portfolioReturns.length < 2 || marketReturns.length === 0) {
      return 1; // Default beta of 1 if no market data
    }

    const minLength = Math.min(portfolioReturns.length, marketReturns.length);
    const portfolioSlice = portfolioReturns.slice(0, minLength);
    const marketSlice = marketReturns.slice(0, minLength);

    const portfolioMean = portfolioSlice.reduce((sum, ret) => sum + ret, 0) / minLength;
    const marketMean = marketSlice.reduce((sum, ret) => sum + ret, 0) / minLength;

    let covariance = 0;
    let marketVariance = 0;

    for (let i = 0; i < minLength; i++) {
      const portfolioDiff = portfolioSlice[i] - portfolioMean;
      const marketDiff = marketSlice[i] - marketMean;
      
      covariance += portfolioDiff * marketDiff;
      marketVariance += marketDiff * marketDiff;
    }

    return marketVariance > 0 ? covariance / marketVariance : 1;
  }

  calculateOutperformance(portfolioReturn: number, benchmarkReturn: number): number {
    return portfolioReturn - benchmarkReturn;
  }

  getWinRate(trades: TradeDTO[]): number {
    const closedTrades = trades.filter(trade => !trade.isOpen);
    
    if (closedTrades.length === 0) {
      return 0;
    }

    const winningTrades = closedTrades.filter(trade => (trade.gain || 0) > 0);
    return (winningTrades.length / closedTrades.length) * 100;
  }

  getAverageHoldingPeriod(trades: TradeDTO[]): number {
    const closedTrades = trades.filter(trade => trade.sellDate && !trade.isOpen);
    
    if (closedTrades.length === 0) {
      return 0;
    }

    const totalDays = closedTrades.reduce((sum, trade) => {
      const buyDate = new Date(trade.buyDate);
      const sellDate = new Date(trade.sellDate!);
      const diffTime = Math.abs(sellDate.getTime() - buyDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);

    return totalDays / closedTrades.length;
  }

  getBestPerformingSymbols(trades: TradeDTO[], limit: number = 5): SymbolPerformanceDTO[] {
    const symbolPerformances = this.getSymbolPerformance(trades);
    return symbolPerformances
      .filter(perf => perf.gainPercentage > 0)
      .slice(0, limit);
  }

  getWorstPerformingSymbols(trades: TradeDTO[], limit: number = 5): SymbolPerformanceDTO[] {
    const symbolPerformances = this.getSymbolPerformance(trades);
    return symbolPerformances
      .filter(perf => perf.gainPercentage < 0)
      .sort((a, b) => a.gainPercentage - b.gainPercentage)
      .slice(0, limit);
  }

  getTradingInsights(trades: TradeDTO[]): Record<string, any> {
    const insights: Record<string, any> = {};
    
    if (trades.length === 0) {
      return { message: 'No trades available for analysis' };
    }

    const performance = this.getPortfolioPerformance(trades);
    const symbolPerformances = this.getSymbolPerformance(trades);
    const winRate = this.getWinRate(trades);
    const avgHoldingPeriod = this.getAverageHoldingPeriod(trades);

    // Portfolio insights
    insights.portfolioHealth = performance.gainPercentage > 0 ? 'Profitable' : 'Loss-making';
    insights.diversification = symbolPerformances.length > 5 ? 'Well-diversified' : 'Concentrated';
    
    // Performance insights
    if (winRate > 70) {
      insights.winRateAssessment = 'Excellent win rate';
    } else if (winRate > 50) {
      insights.winRateAssessment = 'Good win rate';
    } else {
      insights.winRateAssessment = 'Poor win rate - consider reviewing strategy';
    }

    // Holding period insights
    if (avgHoldingPeriod < 7) {
      insights.tradingStyle = 'Day trader / Short-term';
    } else if (avgHoldingPeriod < 30) {
      insights.tradingStyle = 'Swing trader';
    } else if (avgHoldingPeriod < 365) {
      insights.tradingStyle = 'Medium-term investor';
    } else {
      insights.tradingStyle = 'Long-term investor';
    }

    // Risk insights
    const openPositions = trades.filter(t => t.isOpen);
    if (openPositions.length > trades.length * 0.8) {
      insights.riskWarning = 'High concentration in open positions';
    }

    // Top recommendations
    insights.recommendations = [];
    
    if (performance.gainPercentage < 0) {
      insights.recommendations.push('Consider reviewing your stock selection strategy');
    }
    
    if (winRate < 50) {
      insights.recommendations.push('Focus on improving trade timing and entry points');
    }
    
    if (symbolPerformances.length < 3) {
      insights.recommendations.push('Consider diversifying across more symbols');
    }

    return insights;
  }

  // Private helper methods
  private createEmptyPerformance(): PortfolioPerformanceDTO {
    return {
      totalInvestment: 0,
      currentValue: 0,
      totalGain: 0,
      gainPercentage: 0,
      tradeCount: 0,
      openTradeCount: 0,
      closedTradeCount: 0,
      realizedGain: 0,
      unrealizedGain: 0,
    };
  }

  private calculateAverageHoldingPeriodForSymbol(trades: TradeDTO[]): number {
    const closedTrades = trades.filter(trade => trade.sellDate && !trade.isOpen);
    
    if (closedTrades.length === 0) {
      return 0;
    }

    const totalDays = closedTrades.reduce((sum, trade) => {
      const buyDate = new Date(trade.buyDate);
      const sellDate = new Date(trade.sellDate!);
      const diffTime = Math.abs(sellDate.getTime() - buyDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);

    return totalDays / closedTrades.length;
  }
}

// Export singleton instance
export const analyticsService: AnalyticsService = new AnalyticsServiceImpl();
