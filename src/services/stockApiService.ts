/**
 * Stock API Service
 * Handles external stock data API communication
 */

import type { StockQuote } from '../types';
import type { 
  StockQuoteDTO, 
  StockPriceRequestDTO,
  StockSearchRequestDTO,
  StockSearchResultDTO,
  HistoricalPriceDataDTO,
  BatchStockQuoteRequestDTO,
  BatchStockQuoteResponseDTO,
} from '../dto';
import { API_CONFIG, CACHE_DURATION, ERROR_MESSAGES } from '../utils';

export interface StockApiService {
  getStockPrice(symbol: string): Promise<number>;
  getStockQuote(symbol: string): Promise<StockQuote>;
  getStockQuoteDTO(request: StockPriceRequestDTO): Promise<StockQuoteDTO>;
  getBatchQuotes(request: BatchStockQuoteRequestDTO): Promise<BatchStockQuoteResponseDTO>;
  searchStocks(request: StockSearchRequestDTO): Promise<StockSearchResultDTO[]>;
  getHistoricalPrices(
    symbol: string, 
    timeframe: 'daily' | 'weekly' | 'monthly', 
    limit?: number
  ): Promise<HistoricalPriceDataDTO>;
}

class AlphaVantageApiService implements StockApiService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.alphavantage.co/query';
  private readonly priceCache = new Map<string, { price: number; timestamp: number }>();

  constructor() {
    this.apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || 'demo';
  }

  async getStockPrice(symbol: string): Promise<number> {
    const quote = await this.getStockQuote(symbol);
    return quote.price;
  }

  async getStockQuote(symbol: string): Promise<StockQuote> {
    const normalizedSymbol = symbol.toUpperCase();
    
    // Check cache first
    const cachedData = this.priceCache.get(normalizedSymbol);
    const now = Date.now();
    
    if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
      return {
        symbol: normalizedSymbol,
        price: cachedData.price,
        lastUpdated: new Date(cachedData.timestamp).toLocaleDateString(),
      };
    }

    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${normalizedSymbol}&apikey=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const globalQuote = data['Global Quote'];
      
      if (!globalQuote || !globalQuote['05. price']) {
        // For demo purposes, return mock data if API fails
        const mockPrice = this.generateMockPrice(normalizedSymbol);
        return this.createMockQuote(normalizedSymbol, mockPrice);
      }

      const price = parseFloat(globalQuote['05. price']);
      const lastUpdated = globalQuote['07. latest trading day'];

      if (isNaN(price)) {
        throw new Error('Invalid price data received');
      }

      // Update cache
      this.priceCache.set(normalizedSymbol, { price, timestamp: now });

      return {
        symbol: normalizedSymbol,
        price,
        lastUpdated,
      };
    } catch (error) {
      console.warn(`API fallback for ${normalizedSymbol}:`, error);
      
      // Return mock data as fallback
      const mockPrice = this.generateMockPrice(normalizedSymbol);
      return this.createMockQuote(normalizedSymbol, mockPrice);
    }
  }

  async getStockQuoteDTO(request: StockPriceRequestDTO): Promise<StockQuoteDTO> {
    if (request.refresh) {
      this.priceCache.delete(request.symbol.toUpperCase());
    }

    try {
      const quote = await this.getStockQuote(request.symbol);
      
      // Generate additional mock data for demo
      const mockChange = (Math.random() - 0.5) * 10;
      const mockChangePercent = (mockChange / quote.price) * 100;

      return {
        symbol: quote.symbol,
        price: quote.price,
        lastUpdated: quote.lastUpdated,
        change: mockChange,
        changePercent: mockChangePercent,
        high: quote.price * (1 + Math.random() * 0.05),
        low: quote.price * (1 - Math.random() * 0.05),
        open: quote.price * (1 + (Math.random() - 0.5) * 0.02),
        volume: Math.floor(Math.random() * 1000000) + 100000,
      };
    } catch (error) {
      console.error(`Error fetching stock quote for ${request.symbol}:`, error);
      throw new Error(ERROR_MESSAGES.PRICE_FETCH_ERROR);
    }
  }

  async getBatchQuotes(request: BatchStockQuoteRequestDTO): Promise<BatchStockQuoteResponseDTO> {
    const quotes: StockQuoteDTO[] = [];
    const errors: Array<{ symbol: string; error: string }> = [];

    // Process symbols in batches to avoid rate limiting
    const batchSize = 5;
    const batches = this.chunkArray(request.symbols, batchSize);

    for (const batch of batches) {
      const batchPromises = batch.map(async (symbol) => {
        try {
          const quote = await this.getStockQuoteDTO({ 
            symbol, 
            refresh: request.forceRefresh 
          });
          quotes.push(quote);
        } catch (error) {
          errors.push({
            symbol,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });

      await Promise.allSettled(batchPromises);
      
      // Add delay between batches to respect rate limits
      if (batches.indexOf(batch) < batches.length - 1) {
        await this.delay(200);
      }
    }

    return { quotes, errors };
  }

  async searchStocks(request: StockSearchRequestDTO): Promise<StockSearchResultDTO[]> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(request.query)}&apikey=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const matches = data.bestMatches || [];
      const limit = request.limit || 10;

      return matches.slice(0, limit).map((match: any) => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: match['3. type'],
        region: match['4. region'],
        currency: match['8. currency'],
      }));
    } catch (error) {
      console.error('Stock search failed:', error);
      
      // Return mock search results as fallback
      return this.generateMockSearchResults(request.query, request.limit);
    }
  }

  async getHistoricalPrices(
    symbol: string,
    timeframe: 'daily' | 'weekly' | 'monthly' = 'daily',
    limit: number = 30
  ): Promise<HistoricalPriceDataDTO> {
    const functionMap = {
      daily: 'TIME_SERIES_DAILY',
      weekly: 'TIME_SERIES_WEEKLY',
      monthly: 'TIME_SERIES_MONTHLY',
    };

    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}?function=${functionMap[timeframe]}&symbol=${symbol}&apikey=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const timeSeriesKey =
        timeframe === 'daily'
          ? 'Time Series (Daily)'
          : timeframe === 'weekly'
          ? 'Weekly Time Series'
          : 'Monthly Time Series';

      const timeSeries = data[timeSeriesKey];
      
      if (!timeSeries) {
        throw new Error(`No ${timeframe} data available for ${symbol}`);
      }

      const dates = Object.keys(timeSeries).sort().reverse().slice(0, limit);
      const dataPoints = dates.map((date) => {
        const entry = timeSeries[date];
        return {
          date,
          open: parseFloat(entry['1. open']),
          high: parseFloat(entry['2. high']),
          low: parseFloat(entry['3. low']),
          close: parseFloat(entry['4. close']),
          volume: parseInt(entry['5. volume'], 10),
        };
      });

      return {
        symbol: symbol.toUpperCase(),
        timeframe,
        data: dataPoints,
      };
    } catch (error) {
      console.error(`Historical data fetch failed for ${symbol}:`, error);
      
      // Return mock historical data as fallback
      return this.generateMockHistoricalData(symbol, timeframe, limit);
    }
  }

  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private generateMockPrice(symbol: string): number {
    // Generate deterministic but varied mock prices based on symbol
    const base = Array.from(symbol).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return Math.round((50 + (base % 200) + Math.random() * 20) * 100) / 100;
  }

  private createMockQuote(symbol: string, price: number): StockQuote {
    this.priceCache.set(symbol, { price, timestamp: Date.now() });
    
    return {
      symbol,
      price,
      lastUpdated: new Date().toLocaleDateString(),
    };
  }

  private generateMockSearchResults(query: string, limit: number = 10): StockSearchResultDTO[] {
    const mockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'];
    const filtered = mockSymbols.filter(symbol => 
      symbol.toLowerCase().includes(query.toLowerCase())
    );

    return filtered.slice(0, limit).map(symbol => ({
      symbol,
      name: `${symbol} Inc.`,
      type: 'Equity',
      region: 'United States',
      currency: 'USD',
    }));
  }

  private generateMockHistoricalData(
    symbol: string,
    timeframe: string,
    limit: number
  ): HistoricalPriceDataDTO {
    const data = [];
    const basePrice = this.generateMockPrice(symbol);
    let currentPrice = basePrice;

    for (let i = limit - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const change = (Math.random() - 0.5) * 0.1;
      currentPrice = Math.max(1, currentPrice * (1 + change));
      
      const high = currentPrice * (1 + Math.random() * 0.03);
      const low = currentPrice * (1 - Math.random() * 0.03);
      const open = currentPrice * (1 + (Math.random() - 0.5) * 0.02);

      data.push({
        date: date.toISOString().split('T')[0],
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(currentPrice * 100) / 100,
        volume: Math.floor(Math.random() * 1000000) + 100000,
      });
    }

    return {
      symbol: symbol.toUpperCase(),
      timeframe,
      data,
    };
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const stockApiService: StockApiService = new AlphaVantageApiService();
