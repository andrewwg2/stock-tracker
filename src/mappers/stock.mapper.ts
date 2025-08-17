/**
 * Stock Mapper
 * stock.mapper.ts
 * Handles mapping between Stock domain models and DTOs
 */

import type { StockQuote } from '../types';
import type { 
  StockQuoteDTO, 
  HistoricalPricePointDTO,
  HistoricalPriceDataDTO,
  BatchStockQuoteResponseDTO,
  StockSearchResultDTO
} from '../dto';

export class StockMapper {
  /**
   * Maps a domain StockQuote model to StockQuoteDTO
   */
  static toDTO(stockQuote: StockQuote, additionalInfo?: {
    change?: number;
    changePercent?: number;
    high?: number;
    low?: number;
    open?: number;
    volume?: number;
  }): StockQuoteDTO {
    return {
      symbol: stockQuote.symbol,
      price: stockQuote.price,
      lastUpdated: stockQuote.lastUpdated,
      change: additionalInfo?.change,
      changePercent: additionalInfo?.changePercent,
      high: additionalInfo?.high,
      low: additionalInfo?.low,
      open: additionalInfo?.open,
      volume: additionalInfo?.volume,
    };
  }

  /**
   * Maps StockQuoteDTO back to domain StockQuote
   */
  static fromDTO(dto: StockQuoteDTO): StockQuote {
    return {
      symbol: dto.symbol,
      price: dto.price,
      lastUpdated: dto.lastUpdated,
    };
  }

  /**
   * Maps external API data to HistoricalPricePointDTO
   */
  static toHistoricalPricePointDTO(
    date: string, 
    open: number, 
    high: number, 
    low: number, 
    close: number, 
    volume: number
  ): HistoricalPricePointDTO {
    return {
      date,
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
      volume: Number(volume),
    };
  }

  /**
   * Creates a HistoricalPriceDataDTO
   */
  static toHistoricalPriceDataDTO(
    symbol: string, 
    timeframe: string,
    dataPoints: HistoricalPricePointDTO[]
  ): HistoricalPriceDataDTO {
    return {
      symbol: symbol.toUpperCase(),
      timeframe,
      data: dataPoints,
    };
  }

  /**
   * Validates historical price point data
   */
  static validateHistoricalPoint(point: any): point is HistoricalPricePointDTO {
    return (
      typeof point.date === 'string' &&
      typeof point.open === 'number' &&
      typeof point.high === 'number' &&
      typeof point.low === 'number' &&
      typeof point.close === 'number' &&
      typeof point.volume === 'number' &&
      point.high >= point.low &&
      point.high >= point.open &&
      point.high >= point.close &&
      point.low <= point.open &&
      point.low <= point.close
    );
  }

/**
 * Maps batch search results
 */
static toBatchSearchResults(results: any[]): StockSearchResultDTO[] {
  // Handle null/undefined input
  if (!results || !Array.isArray(results)) {
    return [];
  }

  return results
    .filter(result => result && typeof result === 'object')
    .map(result => ({
      symbol: String(result.symbol || '').toUpperCase(),
      name: String(result.name || ''),
      type: String(result.type || 'Equity'),
      region: String(result.region || 'Unknown'),
      currency: String(result.currency || 'USD'),
    }))
    .filter(result => result.symbol.length > 0);
}
/**
 * Creates batch quote response
 */
static toBatchQuoteResponse(
  quotes: StockQuoteDTO[], 
  errors: Array<{ symbol: string; error: string }>
): BatchStockQuoteResponseDTO {
  return {
    quotes: quotes.filter(quote => quote && quote.symbol),
    errors: errors.filter(error => error && error.symbol && error.error),
  };
}
  /**
   * Sanitizes and validates symbol input
   */
  static sanitizeSymbol(symbol: string): string {
    return symbol.trim().toUpperCase().replace(/[^A-Z]/g, '');
  }

/**
 * Validates stock quote data
 */
static validateStockQuote(quote: any): quote is StockQuote {
  return (
    quote != null && // Checks for both null and undefined
    typeof quote === 'object' &&
    typeof quote.symbol === 'string' &&
    typeof quote.price === 'number' &&
    typeof quote.lastUpdated === 'string' &&
    quote.symbol.length > 0 &&
    quote.price > 0
  );
}
  /**
   * Converts price data to chart format
   */
  static toChartData(historicalData: HistoricalPriceDataDTO): Array<{
    date: string;
    price: number;
    volume: number;
  }> {
    return historicalData.data.map(point => ({
      date: point.date,
      price: point.close,
      volume: point.volume,
    }));
  }

  /**
   * Calculates basic technical indicators from historical data
   */
  static calculateBasicIndicators(data: HistoricalPricePointDTO[]): {
    sma20?: number;
    sma50?: number;
    volatility?: number;
    priceChange?: number;
    priceChangePercent?: number;
  } {
    if (data.length === 0) {
      return {};
    }

    const sortedData = [...data].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const indicators: any = {};

    // Simple Moving Averages
    if (sortedData.length >= 20) {
      const last20 = sortedData.slice(-20);
      indicators.sma20 = last20.reduce((sum, point) => sum + point.close, 0) / 20;
    }

    if (sortedData.length >= 50) {
      const last50 = sortedData.slice(-50);
      indicators.sma50 = last50.reduce((sum, point) => sum + point.close, 0) / 50;
    }

    // Volatility (standard deviation of returns)
    if (sortedData.length >= 2) {
      const returns = [];
      for (let i = 1; i < sortedData.length; i++) {
        const prevPrice = sortedData[i - 1].close;
        const currentPrice = sortedData[i].close;
        returns.push((currentPrice - prevPrice) / prevPrice);
      }

      const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
      const variance = returns.reduce((sum, ret) => 
        sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
      indicators.volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility
    }

    // Price change
    if (sortedData.length >= 2) {
      const firstPrice = sortedData[0].close;
      const lastPrice = sortedData[sortedData.length - 1].close;
      indicators.priceChange = lastPrice - firstPrice;
      indicators.priceChangePercent = (indicators.priceChange / firstPrice) * 100;
    }

    return indicators;
  }

/**
 * Formats stock data for export
 */
static toExportFormat(quote: StockQuoteDTO): Record<string, any> {
  return {
    Symbol: quote.symbol,
    Price: quote.price,
    Change: quote.change ?? 0,  // Use nullish coalescing instead of ||
    'Change %': quote.changePercent ?? 0,
    High: quote.high ?? '',
    Low: quote.low ?? '',
    Open: quote.open ?? '',
    Volume: quote.volume ?? '',  // This will preserve 0 but replace undefined/null with ''
    'Last Updated': quote.lastUpdated,
  };
}
}
