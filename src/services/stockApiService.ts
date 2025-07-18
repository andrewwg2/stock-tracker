import type { StockQuote } from '../types';
import type { 
  StockQuoteDTO, 
  StockPriceRequestDTO,
  StockSearchRequestDTO,
  StockSearchResultDTO,
  HistoricalPriceDataDTO 
} from '../dto';
import { StockMapper } from '../mappers';

/**
 * Enhanced Stock API Service interface with DTO support
 */
export interface StockApiService {
  // Original methods
  getStockPrice(symbol: string): Promise<number>;
  getStockQuote(symbol: string): Promise<StockQuote>;

  // New DTO-based methods
  getStockQuoteDTO(request: StockPriceRequestDTO): Promise<StockQuoteDTO>;
  searchStocks(request: StockSearchRequestDTO): Promise<StockSearchResultDTO[]>;
  getHistoricalPrices(symbol: string, timeframe: 'daily' | 'weekly' | 'monthly', limit?: number): Promise<HistoricalPriceDataDTO>;
}

class AlphaVantageService implements StockApiService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.alphavantage.co/query';
  private readonly cacheExpiration = 15 * 60 * 1000; // 15 minutes
  private priceCache: Map<string, { price: number, timestamp: number }> = new Map();

  constructor() {
    this.apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
    if (!this.apiKey) {
      throw new Error('VITE_ALPHA_VANTAGE_API_KEY environment variable is required');
    }
  }

  // Original methods
  async getStockPrice(symbol: string): Promise<number> {
    const quote = await this.getStockQuote(symbol);
    return quote.price;
  }

  async getStockQuote(symbol: string): Promise<StockQuote> {
    // Try to get from cache first
    const cachedData = this.priceCache.get(symbol.toUpperCase());
    const now = Date.now();
    
    if (cachedData && now - cachedData.timestamp < this.cacheExpiration) {
      return {
        symbol: symbol.toUpperCase(),
        price: cachedData.price,
        lastUpdated: new Date(cachedData.timestamp).toLocaleDateString()
      };
    }
    
    const url = `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      const globalQuote = data["Global Quote"];
      if (!globalQuote) {
        throw new Error('Invalid response format or symbol not found');
      }
      
      const price = parseFloat(globalQuote["05. price"]);
      const lastUpdated = globalQuote["07. latest trading day"];
      
      if (isNaN(price)) {
        throw new Error('Invalid price data received');
      }
      
      // Update cache
      this.priceCache.set(symbol.toUpperCase(), {
        price,
        timestamp: now
      });
      
      return {
        symbol: symbol.toUpperCase(),
        price,
        lastUpdated
      };
    } catch (error) {
      console.error('Failed to fetch stock quote:', error);
      throw new Error(`Failed to fetch stock price for ${symbol}`);
    }
  }

  // New DTO-based methods
  async getStockQuoteDTO(request: StockPriceRequestDTO): Promise<StockQuoteDTO> {
    // If refresh is true or symbol isn't in cache, fetch new data
    if (request.refresh) {
      this.priceCache.delete(request.symbol.toUpperCase());
    }

    try {
      const quote = await this.getStockQuote(request.symbol);

      // For this example, we're assuming the extended info might come from a different endpoint
      // or calculation in a real implementation
      const additionalInfo = {
        change: Math.random() * 2 - 1, // Mock data
        changePercent: (Math.random() * 4 - 2) * 100, // Mock data
      };

      return StockMapper.toDTO(quote, additionalInfo);
    } catch (error) {
      console.error(`Error fetching stock quote for ${request.symbol}:`, error);
      throw error;
    }
  }

  async searchStocks(request: StockSearchRequestDTO): Promise<StockSearchResultDTO[]> {
    const url = `${this.baseUrl}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(request.query)}&apikey=${this.apiKey}`;
    
    try {
      const response = await fetch(url);
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
      console.error('Failed to search stocks:', error);
      throw new Error(`Failed to search for "${request.query}"`);
    }
  }

  async getHistoricalPrices(
    symbol: string, 
    timeframe: 'daily' | 'weekly' | 'monthly' = 'daily', 
    limit: number = 30
  ): Promise<HistoricalPriceDataDTO> {
    // Map timeframe to Alpha Vantage function
    const functionMap = {
      daily: 'TIME_SERIES_DAILY',
      weekly: 'TIME_SERIES_WEEKLY',
      monthly: 'TIME_SERIES_MONTHLY'
    };
    
    const function_name = functionMap[timeframe];
    const url = `${this.baseUrl}?function=${function_name}&symbol=${symbol}&apikey=${this.apiKey}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      // Parse response based on timeframe
      const timeSeriesKey = 
        timeframe === 'daily' ? 'Time Series (Daily)' : 
        timeframe === 'weekly' ? 'Weekly Time Series' : 
        'Monthly Time Series';
      
      const timeSeries = data[timeSeriesKey];
      if (!timeSeries) {
        throw new Error(`No ${timeframe} data available for ${symbol}`);
      }
      
      // Convert to array and sort by date
      const dates = Object.keys(timeSeries).sort().reverse().slice(0, limit);
      
      const dataPoints = dates.map(date => {
        const entry = timeSeries[date];
        return StockMapper.toHistoricalPricePointDTO(
          date,
          parseFloat(entry['1. open']),
          parseFloat(entry['2. high']),
          parseFloat(entry['3. low']),
          parseFloat(entry['4. close']),
          parseInt(entry['5. volume'], 10)
        );
      });
      
      return StockMapper.toHistoricalPriceDataDTO(
        symbol.toUpperCase(),
        timeframe,
        dataPoints
      );
    } catch (error) {
      console.error(`Failed to fetch historical prices for ${symbol}:`, error);
      throw new Error(`Failed to fetch ${timeframe} prices for ${symbol}`);
    }
  }
}

// Export singleton instance
export const stockApiService: StockApiService = new AlphaVantageService();
