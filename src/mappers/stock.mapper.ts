import type { StockQuote } from '../types';
import type { 
  StockQuoteDTO, 
  HistoricalPricePointDTO,
  HistoricalPriceDataDTO
} from '../dto';

/**
 * Mapper class for Stock entities
 */
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
      ...additionalInfo
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
      open,
      high,
      low,
      close,
      volume
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
      symbol,
      timeframe,
      data: dataPoints
    };
  }
}
