/**
 * Stock-related type definitions
 */

export interface StockQuote {
  symbol: string;
  price: number;
  lastUpdated: string;
}

export interface StockDTO {
  symbol: string;
  price?: number;
  priceChange?: number;
  priceChangePercent?: number;
  lastUpdated?: string;
}

export interface StockPriceResponse {
  symbol: string;
  price: number;
  timestamp: number;
}

export interface BatchPriceRequest {
  symbols: string[];
  forceRefresh?: boolean;
}

export interface BatchPriceResponse {
  prices: Map<string, number>;
  errors: string[];
}
