/**
 * Data Transfer Object for Stock Quote
 */
export interface StockQuoteDTO {
  symbol: string;
  price: number;
  lastUpdated: string;
  change?: number;
  changePercent?: number;
  high?: number;
  low?: number;
  open?: number;
  volume?: number;
}

/**
 * DTO for Stock Price Request
 */
export interface StockPriceRequestDTO {
  symbol: string;
  refresh?: boolean;
}

/**
 * DTO for Stock Search
 */
export interface StockSearchRequestDTO {
  query: string;
  limit?: number;
}

/**
 * DTO for Stock Search Result
 */
export interface StockSearchResultDTO {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

/**
 * DTO for historical stock data
 */
export interface HistoricalPricePointDTO {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * DTO for historical price data response
 */
export interface HistoricalPriceDataDTO {
  symbol: string;
  timeframe: string; // daily, weekly, monthly
  data: HistoricalPricePointDTO[];
}
