/**
 * Data Transfer Object for Trade Gain Data
 */
export interface TradeGainDTO {
  date: string;
  gain: number;
  symbol: string;
}

/**
 * DTO for Portfolio Performance
 */
export interface PortfolioPerformanceDTO {
  totalInvestment: number;
  currentValue: number;
  totalGain: number;
  gainPercentage: number;
  tradeCount: number;
  openTradeCount: number;
  closedTradeCount: number;
}

/**
 * DTO for time-based performance data
 */
export interface TimePerformanceDataPointDTO {
  date: string;
  value: number;
}

/**
 * DTO for performance over time
 */
export interface PerformanceOverTimeDTO {
  startDate: string;
  endDate: string;
  dataPoints: TimePerformanceDataPointDTO[];
  overallGainPercentage: number;
}

/**
 * DTO for symbol-based performance summary
 */
export interface SymbolPerformanceDTO {
  symbol: string;
  investment: number;
  currentValue: number;
  gain: number;
  gainPercentage: number;
  tradeCount: number;
}
