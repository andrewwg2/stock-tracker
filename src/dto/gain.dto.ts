/**
 * Gain and Performance-related Data Transfer Objects
 */

export interface TradeGainDTO {
  date: string;
  gain: number;
  symbol: string;
  tradeid?: string;
}

export interface PortfolioPerformanceDTO {
  totalInvestment: number;
  currentValue: number;
  totalGain: number;
  gainPercentage: number;
  tradeCount: number;
  openTradeCount: number;
  closedTradeCount: number;
  realizedGain: number;
  unrealizedGain: number;
}

export interface TimePerformanceDataPointDTO {
  date: string;
  value: number;
  gain: number;
  cumulativeGain: number;
}

export interface PerformanceOverTimeDTO {
  startDate: string;
  endDate: string;
  dataPoints: TimePerformanceDataPointDTO[];
  overallGainPercentage: number;
  volatility: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

export interface SymbolPerformanceDTO {
  symbol: string;
  investment: number;
  currentValue: number;
  gain: number;
  gainPercentage: number;
  tradeCount: number;
  averageHoldingPeriod: number;
  winRate: number;
}

export interface PortfolioCompositionDTO {
  symbol: string;
  allocation: number; // percentage
  value: number;
  quantity: number;
  averagePrice: number;
}

export interface RiskMetricsDTO {
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  beta?: number;
  alpha?: number;
  valueAtRisk: number;
}

export interface PerformanceComparisonDTO {
  period: string;
  portfolioReturn: number;
  benchmarkReturn?: number;
  outperformance?: number;
  winningTrades: number;
  losingTrades: number;
  averageWin: number;
  averageLoss: number;
}
