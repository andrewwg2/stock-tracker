/**
 * Oscillator Analysis Service
 * Provides functionality for calculating stock price oscillation metrics
 */

import { stockApiService } from './stockApiService';
import type { OscillatorAnalysisDTO, OscillatorAnalysisRequestDTO } from '../dto';

export interface OscillatorService {
  analyzeOscillation(request: OscillatorAnalysisRequestDTO): Promise<OscillatorAnalysisDTO>;
}

class StockOscillatorService implements OscillatorService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.alphavantage.co/query';

  constructor() {
    this.apiKey = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || 'demo';
  }

  async analyzeOscillation(request: OscillatorAnalysisRequestDTO): Promise<OscillatorAnalysisDTO> {
    const { symbol, days = 30 } = request;

    if (!symbol) {
      throw new Error('Symbol is required for oscillation analysis');
    }

    try {
      // First confirm the symbol exists
      await stockApiService.getStockQuote(symbol);
      
      // Fetch historical data
      const url = `${this.baseUrl}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${this.apiKey}&outputsize=compact`;
      const res = await fetch(url);
      const json = await res.json();

      const ts = json['Time Series (Daily)'];
      if (!ts || typeof ts !== 'object') {
        throw new Error('Invalid response format');
      }

      // Process the data to calculate oscillation metrics
      const prices = Object.values(ts).slice(0, days).map((d: any) => parseFloat(d['4. close']));
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const variance = prices.reduce((a, b) => a + (b - avg) ** 2, 0) / prices.length;
      const stddev = Math.sqrt(variance);

      return {
        symbol,
        swingPct: ((max - min) / avg) * 100,
        stddevPct: (stddev / avg) * 100,
        dataPoints: prices.length
      };
    } catch (error) {
      console.warn('Falling back to simulated oscillation data:', error);
      
      // Simulated fallback
      return this.generateSimulatedData(symbol, days);
    }
  }

  private generateSimulatedData(symbol: string, days: number): OscillatorAnalysisDTO {
    return {
      symbol,
      swingPct: 6.2 + Math.random() * 3, // 6.2–9.2%
      stddevPct: 2.1 + Math.random() * 2, // 2.1–4.1%
      dataPoints: days,
      simulated: true
    };
  }
}

// Export singleton instance
export const oscillatorService: OscillatorService = new StockOscillatorService();
