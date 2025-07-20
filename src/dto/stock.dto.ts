/**
 * Stock-related Data Transfer Objects
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

export interface StockPriceRequestDTO {
  symbol: string;
  refresh?: boolean;
}

export interface StockSearchRequestDTO {
  query: string;
  limit?: number;
}

export interface StockSearchResultDTO {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

export interface HistoricalPricePointDTO {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalPriceDataDTO {
  symbol: string;
  timeframe: string;
  data: HistoricalPricePointDTO[];
}

export interface BatchStockQuoteRequestDTO {
  symbols: string[];
  forceRefresh?: boolean;
}

export interface BatchStockQuoteResponseDTO {
  quotes: StockQuoteDTO[];
  errors: Array<{
    symbol: string;
    error: string;
  }>;
}
