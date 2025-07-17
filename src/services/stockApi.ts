import type { StockQuote } from '../types';

export interface StockApiService {
  getStockPrice(symbol: string): Promise<number>;
  getStockQuote(symbol: string): Promise<StockQuote>;
}

class AlphaVantageService implements StockApiService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.alphavantage.co/query';

  constructor() {
    this.apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
    if (!this.apiKey) {
      throw new Error('VITE_ALPHA_VANTAGE_API_KEY environment variable is required');
    }
  }

  async getStockPrice(symbol: string): Promise<number> {
    const quote = await this.getStockQuote(symbol);
    return quote.price;
  }

  async getStockQuote(symbol: string): Promise<StockQuote> {
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
}

// Export singleton instance
export const stockApiService: StockApiService = new AlphaVantageService();
