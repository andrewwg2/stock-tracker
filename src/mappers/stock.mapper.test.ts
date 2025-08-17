// StockMapper.test.ts

import { describe, it, expect } from 'vitest';
import { StockMapper } from './stock.mapper';
import type { StockQuote } from '../types';
import type { 
  StockQuoteDTO, 
  HistoricalPricePointDTO,
  HistoricalPriceDataDTO,
  StockSearchResultDTO
} from '../dto';

describe('StockMapper', () => {
  // Sample test data
  const mockStockQuote: StockQuote = {
    symbol: 'AAPL',
    price: 175.50,
    lastUpdated: '2024-01-15T10:30:00Z',
  };

  const mockHistoricalPoint: HistoricalPricePointDTO = {
    date: '2024-01-15',
    open: 170.00,
    high: 176.00,
    low: 169.50,
    close: 175.50,
    volume: 50000000,
  };

  describe('toDTO', () => {
    it('should map StockQuote to DTO without additional info', () => {
      const dto = StockMapper.toDTO(mockStockQuote);

      expect(dto).toEqual({
        symbol: 'AAPL',
        price: 175.50,
        lastUpdated: '2024-01-15T10:30:00Z',
        change: undefined,
        changePercent: undefined,
        high: undefined,
        low: undefined,
        open: undefined,
        volume: undefined,
      });
    });

    it('should map StockQuote to DTO with additional info', () => {
      const additionalInfo = {
        change: 2.50,
        changePercent: 1.44,
        high: 176.00,
        low: 172.00,
        open: 173.00,
        volume: 50000000,
      };

      const dto = StockMapper.toDTO(mockStockQuote, additionalInfo);

      expect(dto).toEqual({
        symbol: 'AAPL',
        price: 175.50,
        lastUpdated: '2024-01-15T10:30:00Z',
        change: 2.50,
        changePercent: 1.44,
        high: 176.00,
        low: 172.00,
        open: 173.00,
        volume: 50000000,
      });
    });

    it('should handle partial additional info', () => {
      const partialInfo = {
        change: -1.25,
        changePercent: -0.71,
      };

      const dto = StockMapper.toDTO(mockStockQuote, partialInfo);

      expect(dto.change).toBe(-1.25);
      expect(dto.changePercent).toBe(-0.71);
      expect(dto.high).toBeUndefined();
      expect(dto.low).toBeUndefined();
    });

    it('should handle zero values in additional info', () => {
      const zeroInfo = {
        change: 0,
        changePercent: 0,
        volume: 0,
      };

      const dto = StockMapper.toDTO(mockStockQuote, zeroInfo);

      expect(dto.change).toBe(0);
      expect(dto.changePercent).toBe(0);
      expect(dto.volume).toBe(0);
    });
  });

  describe('fromDTO', () => {
    it('should map StockQuoteDTO to domain model', () => {
      const dto: StockQuoteDTO = {
        symbol: 'GOOGL',
        price: 140.25,
        lastUpdated: '2024-01-15T11:00:00Z',
        change: 1.25,
        changePercent: 0.90,
        high: 141.00,
        low: 138.50,
        open: 139.00,
        volume: 25000000,
      };

      const stockQuote = StockMapper.fromDTO(dto);

      expect(stockQuote).toEqual({
        symbol: 'GOOGL',
        price: 140.25,
        lastUpdated: '2024-01-15T11:00:00Z',
      });
    });

    it('should handle DTO with undefined optional fields', () => {
      const dto: StockQuoteDTO = {
        symbol: 'MSFT',
        price: 400.00,
        lastUpdated: '2024-01-15T12:00:00Z',
      };

      const stockQuote = StockMapper.fromDTO(dto);

      expect(stockQuote).toEqual({
        symbol: 'MSFT',
        price: 400.00,
        lastUpdated: '2024-01-15T12:00:00Z',
      });
    });
  });

  describe('toHistoricalPricePointDTO', () => {
    it('should create historical price point DTO', () => {
      const point = StockMapper.toHistoricalPricePointDTO(
        '2024-01-15',
        170.00,
        176.00,
        169.50,
        175.50,
        50000000
      );

      expect(point).toEqual({
        date: '2024-01-15',
        open: 170.00,
        high: 176.00,
        low: 169.50,
        close: 175.50,
        volume: 50000000,
      });
    });

    it('should convert string numbers to numbers', () => {
      const point = StockMapper.toHistoricalPricePointDTO(
        '2024-01-15',
        '170.00' as any,
        '176.00' as any,
        '169.50' as any,
        '175.50' as any,
        '50000000' as any
      );

      expect(typeof point.open).toBe('number');
      expect(typeof point.high).toBe('number');
      expect(typeof point.low).toBe('number');
      expect(typeof point.close).toBe('number');
      expect(typeof point.volume).toBe('number');
      expect(point.open).toBe(170.00);
    });

    it('should handle NaN values', () => {
      const point = StockMapper.toHistoricalPricePointDTO(
        '2024-01-15',
        'invalid' as any,
        176.00,
        169.50,
        175.50,
        50000000
      );

      expect(point.open).toBeNaN();
      expect(point.high).toBe(176.00);
    });
  });

  describe('toHistoricalPriceDataDTO', () => {
    it('should create historical price data DTO', () => {
      const dataPoints = [mockHistoricalPoint];
      const result = StockMapper.toHistoricalPriceDataDTO(
        'aapl',
        '1D',
        dataPoints
      );

      expect(result).toEqual({
        symbol: 'AAPL',
        timeframe: '1D',
        data: dataPoints,
      });
    });

    it('should uppercase symbol', () => {
      const result = StockMapper.toHistoricalPriceDataDTO(
        'googl',
        '1W',
        []
      );

      expect(result.symbol).toBe('GOOGL');
    });

    it('should handle empty data points', () => {
      const result = StockMapper.toHistoricalPriceDataDTO(
        'MSFT',
        '1M',
        []
      );

      expect(result.data).toEqual([]);
      expect(result.data).toHaveLength(0);
    });

    it('should preserve original data points', () => {
      const points = [
        { ...mockHistoricalPoint, date: '2024-01-14' },
        { ...mockHistoricalPoint, date: '2024-01-15' },
      ];

      const result = StockMapper.toHistoricalPriceDataDTO('AAPL', '2D', points);

      expect(result.data).toHaveLength(2);
      expect(result.data).toBe(points); // Same reference
    });
  });

  describe('validateHistoricalPoint', () => {
    it('should validate correct historical point', () => {
      const validPoint = {
        date: '2024-01-15',
        open: 170.00,
        high: 176.00,
        low: 169.50,
        close: 175.50,
        volume: 50000000,
      };

      expect(StockMapper.validateHistoricalPoint(validPoint)).toBe(true);
    });

    it('should reject point with invalid high/low relationship', () => {
      const invalidPoint = {
        date: '2024-01-15',
        open: 170.00,
        high: 169.00, // High is less than low
        low: 175.00,
        close: 172.00,
        volume: 50000000,
      };

      expect(StockMapper.validateHistoricalPoint(invalidPoint)).toBe(false);
    });

    it('should reject point with high less than open', () => {
      const invalidPoint = {
        date: '2024-01-15',
        open: 180.00,
        high: 175.00, // High is less than open
        low: 170.00,
        close: 172.00,
        volume: 50000000,
      };

      expect(StockMapper.validateHistoricalPoint(invalidPoint)).toBe(false);
    });

    it('should reject point with low greater than close', () => {
      const invalidPoint = {
        date: '2024-01-15',
        open: 170.00,
        high: 176.00,
        low: 175.00, // Low is greater than close
        close: 172.00,
        volume: 50000000,
      };

      expect(StockMapper.validateHistoricalPoint(invalidPoint)).toBe(false);
    });

    it('should reject point with missing fields', () => {
      const incompletePoint = {
        date: '2024-01-15',
        open: 170.00,
        high: 176.00,
        // missing low, close, volume
      };

      expect(StockMapper.validateHistoricalPoint(incompletePoint)).toBe(false);
    });

    it('should reject point with wrong field types', () => {
      const wrongTypes = {
        date: 12345, // Should be string
        open: '170.00', // Should be number
        high: 176.00,
        low: 169.50,
        close: 175.50,
        volume: 50000000,
      };

      expect(StockMapper.validateHistoricalPoint(wrongTypes)).toBe(false);
    });

    it('should accept point where high equals low (no price movement)', () => {
      const flatPoint = {
        date: '2024-01-15',
        open: 100.00,
        high: 100.00,
        low: 100.00,
        close: 100.00,
        volume: 1000000,
      };

      expect(StockMapper.validateHistoricalPoint(flatPoint)).toBe(true);
    });
  });

describe('toBatchSearchResults', () => {
  it('should map valid search results', () => {
    const rawResults = [
      {
        symbol: 'aapl',
        name: 'Apple Inc.',
        type: 'Equity',
        region: 'US',
        currency: 'USD',
      },
      {
        symbol: 'googl',
        name: 'Alphabet Inc.',
        type: 'Equity',
        region: 'US',
        currency: 'USD',
      },
    ];

    const results = StockMapper.toBatchSearchResults(rawResults);

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      symbol: 'AAPL',
      name: 'Apple Inc.',
      type: 'Equity',
      region: 'US',
      currency: 'USD',
    });
  });

  it('should filter out invalid results', () => {
    const mixedResults = [
      { symbol: 'AAPL', name: 'Apple Inc.' },
      null,
      undefined,
      { symbol: '', name: 'Invalid' }, // Empty symbol
      { symbol: 'GOOGL', name: 'Alphabet Inc.' },
      'invalid string',
      123,
    ];

    const results = StockMapper.toBatchSearchResults(mixedResults);

    expect(results).toHaveLength(2);
    expect(results[0].symbol).toBe('AAPL');
    expect(results[1].symbol).toBe('GOOGL');
  });

  it('should provide defaults for missing fields', () => {
    const minimalResults = [
      { symbol: 'TSLA' }, // Only symbol provided
    ];

    const results = StockMapper.toBatchSearchResults(minimalResults);

    expect(results[0]).toEqual({
      symbol: 'TSLA',
      name: '',
      type: 'Equity',
      region: 'Unknown',
      currency: 'USD',
    });
  });

  // Fixed test - now correctly handles null/undefined inputs
  it('should handle empty and invalid input', () => {
    expect(StockMapper.toBatchSearchResults([])).toEqual([]);
    expect(StockMapper.toBatchSearchResults(null as any)).toEqual([]);
    expect(StockMapper.toBatchSearchResults(undefined as any)).toEqual([]);
    expect(StockMapper.toBatchSearchResults('not an array' as any)).toEqual([]);
    expect(StockMapper.toBatchSearchResults(123 as any)).toEqual([]);
  });

  it('should convert all values to strings and handle edge cases', () => {
    const results = [
      {
        symbol: 123,
        name: true,
        type: null,
        region: undefined,
        currency: { value: 'USD' },
      },
    ];

    const mapped = StockMapper.toBatchSearchResults(results);

    expect(mapped[0].symbol).toBe('123');
    expect(mapped[0].name).toBe('true'); // Boolean to string conversion
    expect(mapped[0].type).toBe('Equity'); // Default value
    expect(mapped[0].region).toBe('Unknown'); // Default value
    expect(mapped[0].currency).toBe('[object Object]'); // Object to string
  });
});

describe('toBatchQuoteResponse', () => {
  it('should create batch quote response', () => {
    const quotes: StockQuoteDTO[] = [
      {
        symbol: 'AAPL',
        price: 175.50,
        lastUpdated: '2024-01-15T10:30:00Z',
      },
      {
        symbol: 'GOOGL',
        price: 140.25,
        lastUpdated: '2024-01-15T10:30:00Z',
      },
    ];

    const errors = [
      { symbol: 'INVALID', error: 'Symbol not found' },
    ];

    const response = StockMapper.toBatchQuoteResponse(quotes, errors);

    expect(response.quotes).toHaveLength(2);
    expect(response.errors).toHaveLength(1);
    expect(response.errors[0].symbol).toBe('INVALID');
  });

  it('should filter out invalid quotes', () => {
    const quotes: any[] = [
      { symbol: 'AAPL', price: 175.50, lastUpdated: '2024-01-15' },
      null,
      { symbol: '', price: 100 }, // Invalid - empty symbol
      { price: 200 }, // Invalid - no symbol
      undefined,
    ];

    const response = StockMapper.toBatchQuoteResponse(quotes, []);

    expect(response.quotes).toHaveLength(1);
    expect(response.quotes[0].symbol).toBe('AAPL');
  });

  it('should filter out invalid errors', () => {
    const errors: any[] = [
      { symbol: 'ERR1', error: 'Error message' },
      { symbol: '', error: 'No symbol' }, // Invalid - empty symbol
      { symbol: 'ERR2' }, // Invalid - no error message
      { symbol: 'ERR3', error: '' }, // Invalid - empty error message
      null,
      undefined,
      {},
      { error: 'No symbol prop' }, // Invalid - missing symbol
    ];

    const response = StockMapper.toBatchQuoteResponse([], errors);

    expect(response.errors).toHaveLength(1);
    expect(response.errors[0].symbol).toBe('ERR1');
    expect(response.errors[0].error).toBe('Error message');
  });

  it('should handle empty inputs', () => {
    const response = StockMapper.toBatchQuoteResponse([], []);

    expect(response.quotes).toEqual([]);
    expect(response.errors).toEqual([]);
  });

  it('should handle null/undefined in arrays', () => {
    const quotes: any[] = [
      { symbol: 'VALID', price: 100, lastUpdated: '2024-01-15' },
      null,
      undefined,
      null,
    ];

    const errors: any[] = [
      null,
      { symbol: 'ERR', error: 'Valid error' },
      undefined,
      null,
    ];

    const response = StockMapper.toBatchQuoteResponse(quotes, errors);

    expect(response.quotes).toHaveLength(1);
    expect(response.errors).toHaveLength(1);
  });
});

  describe('sanitizeSymbol', () => {
    it('should uppercase and trim symbol', () => {
      expect(StockMapper.sanitizeSymbol('  aapl  ')).toBe('AAPL');
      expect(StockMapper.sanitizeSymbol('googl')).toBe('GOOGL');
      expect(StockMapper.sanitizeSymbol('MsFt')).toBe('MSFT');
    });

    it('should remove non-letter characters', () => {
      expect(StockMapper.sanitizeSymbol('AAPL123')).toBe('AAPL');
      expect(StockMapper.sanitizeSymbol('GO-OGL')).toBe('GOOGL');
      expect(StockMapper.sanitizeSymbol('MS.FT')).toBe('MSFT');
      expect(StockMapper.sanitizeSymbol('TS$LA')).toBe('TSLA');
    });

    it('should handle empty or invalid input', () => {
      expect(StockMapper.sanitizeSymbol('')).toBe('');
      expect(StockMapper.sanitizeSymbol('   ')).toBe('');
      expect(StockMapper.sanitizeSymbol('123')).toBe('');
      expect(StockMapper.sanitizeSymbol('!@#$')).toBe('');
    });

    it('should handle mixed valid and invalid characters', () => {
      expect(StockMapper.sanitizeSymbol('A1B2C3')).toBe('ABC');
      expect(StockMapper.sanitizeSymbol('$AAPL')).toBe('AAPL');
      expect(StockMapper.sanitizeSymbol('GOOGL.O')).toBe('GOOGLO');
    });
  });

describe('validateStockQuote', () => {
  it('should validate correct stock quote', () => {
    const validQuote = {
      symbol: 'AAPL',
      price: 175.50,
      lastUpdated: '2024-01-15T10:30:00Z',
    };

    expect(StockMapper.validateStockQuote(validQuote)).toBe(true);
  });

  it('should reject quote with invalid price', () => {
    const invalidPrices = [
      { symbol: 'AAPL', price: 0, lastUpdated: '2024-01-15' },
      { symbol: 'AAPL', price: -10, lastUpdated: '2024-01-15' },
      { symbol: 'AAPL', price: '175.50', lastUpdated: '2024-01-15' },
      { symbol: 'AAPL', price: null, lastUpdated: '2024-01-15' },
      { symbol: 'AAPL', price: undefined, lastUpdated: '2024-01-15' },
      { symbol: 'AAPL', price: NaN, lastUpdated: '2024-01-15' },
    ];

    invalidPrices.forEach(quote => {
      expect(StockMapper.validateStockQuote(quote)).toBe(false);
    });
  });

  it('should reject quote with invalid symbol', () => {
    const invalidSymbols = [
      { symbol: '', price: 175.50, lastUpdated: '2024-01-15' },
      { symbol: 123, price: 175.50, lastUpdated: '2024-01-15' },
      { symbol: null, price: 175.50, lastUpdated: '2024-01-15' },
      { symbol: undefined, price: 175.50, lastUpdated: '2024-01-15' },
      { symbol: [], price: 175.50, lastUpdated: '2024-01-15' },
      { symbol: {}, price: 175.50, lastUpdated: '2024-01-15' },
    ];

    invalidSymbols.forEach(quote => {
      expect(StockMapper.validateStockQuote(quote)).toBe(false);
    });
  });

  it('should reject quote with missing fields', () => {
    expect(StockMapper.validateStockQuote(null)).toBe(false);
    expect(StockMapper.validateStockQuote(undefined)).toBe(false);
    expect(StockMapper.validateStockQuote({})).toBe(false);
    expect(StockMapper.validateStockQuote({ symbol: 'AAPL' })).toBe(false);
    expect(StockMapper.validateStockQuote({ symbol: 'AAPL', price: 100 })).toBe(false);
    expect(StockMapper.validateStockQuote({ price: 100, lastUpdated: '2024-01-15' })).toBe(false);
  });

  it('should reject quote with wrong lastUpdated type', () => {
    const invalidDates = [
      { symbol: 'AAPL', price: 175.50, lastUpdated: 12345 },
      { symbol: 'AAPL', price: 175.50, lastUpdated: null },
      { symbol: 'AAPL', price: 175.50, lastUpdated: undefined },
      { symbol: 'AAPL', price: 175.50, lastUpdated: true },
      { symbol: 'AAPL', price: 175.50, lastUpdated: [] },
      { symbol: 'AAPL', price: 175.50, lastUpdated: {} },
    ];

    invalidDates.forEach(quote => {
      expect(StockMapper.validateStockQuote(quote)).toBe(false);
    });
  });

  it('should reject non-object values', () => {
    expect(StockMapper.validateStockQuote('string')).toBe(false);
    expect(StockMapper.validateStockQuote(123)).toBe(false);
    expect(StockMapper.validateStockQuote(true)).toBe(false);
    expect(StockMapper.validateStockQuote([])).toBe(false);
    expect(StockMapper.validateStockQuote(() => {})).toBe(false);
  });

  it('should accept valid minimal quote', () => {
    const minimalQuote = {
      symbol: 'A', // Single character symbol
      price: 0.01, // Very small but positive price
      lastUpdated: '', // Empty string is still a string
    };

    expect(StockMapper.validateStockQuote(minimalQuote)).toBe(true);
  });
});


  describe('toChartData', () => {
    it('should convert historical data to chart format', () => {
      const historicalData: HistoricalPriceDataDTO = {
        symbol: 'AAPL',
        timeframe: '5D',
        data: [
          {
            date: '2024-01-11',
            open: 170,
            high: 172,
            low: 169,
            close: 171,
            volume: 40000000,
          },
          {
            date: '2024-01-12',
            open: 171,
            high: 174,
            low: 170,
            close: 173,
            volume: 45000000,
          },
        ],
      };

      const chartData = StockMapper.toChartData(historicalData);

      expect(chartData).toHaveLength(2);
      expect(chartData[0]).toEqual({
        date: '2024-01-11',
        price: 171,
        volume: 40000000,
      });
      expect(chartData[1]).toEqual({
        date: '2024-01-12',
        price: 173,
        volume: 45000000,
      });
    });

    it('should handle empty data', () => {
      const emptyData: HistoricalPriceDataDTO = {
        symbol: 'AAPL',
        timeframe: '1D',
        data: [],
      };

      const chartData = StockMapper.toChartData(emptyData);

      expect(chartData).toEqual([]);
    });
  });

  describe('calculateBasicIndicators', () => {
    it('should calculate SMA20 with sufficient data', () => {
      const data = Array.from({ length: 20 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        open: 100,
        high: 102,
        low: 99,
        close: 100 + i, // Incrementing close price
        volume: 1000000,
      }));

      const indicators = StockMapper.calculateBasicIndicators(data);

      expect(indicators.sma20).toBeDefined();
      expect(indicators.sma20).toBeCloseTo(109.5, 1); // Average of 100-119
    });

    it('should calculate SMA50 with sufficient data', () => {
      const data = Array.from({ length: 50 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        open: 100,
        high: 102,
        low: 99,
        close: 100,
        volume: 1000000,
      }));

      const indicators = StockMapper.calculateBasicIndicators(data);

      expect(indicators.sma50).toBeDefined();
      expect(indicators.sma50).toBe(100);
    });

    it('should not calculate SMAs with insufficient data', () => {
      const data = Array.from({ length: 10 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        open: 100,
        high: 102,
        low: 99,
        close: 100,
        volume: 1000000,
      }));

      const indicators = StockMapper.calculateBasicIndicators(data);

      expect(indicators.sma20).toBeUndefined();
      expect(indicators.sma50).toBeUndefined();
    });

    it('should calculate volatility', () => {
      const data = [
        { date: '2024-01-01', open: 100, high: 102, low: 98, close: 100, volume: 1000000 },
        { date: '2024-01-02', open: 100, high: 105, low: 99, close: 105, volume: 1000000 },
        { date: '2024-01-03', open: 105, high: 107, low: 103, close: 103, volume: 1000000 },
      ];

      const indicators = StockMapper.calculateBasicIndicators(data);

      expect(indicators.volatility).toBeDefined();
      expect(indicators.volatility).toBeGreaterThan(0);
    });

    it('should calculate price change and percentage', () => {
      const data = [
        { date: '2024-01-01', open: 100, high: 102, low: 98, close: 100, volume: 1000000 },
        { date: '2024-01-02', open: 100, high: 112, low: 99, close: 110, volume: 1000000 },
      ];

      const indicators = StockMapper.calculateBasicIndicators(data);

      expect(indicators.priceChange).toBe(10);
      expect(indicators.priceChangePercent).toBe(10);
    });

    it('should handle negative price changes', () => {
      const data = [
        { date: '2024-01-01', open: 100, high: 102, low: 98, close: 100, volume: 1000000 },
        { date: '2024-01-02', open: 90, high: 95, low: 85, close: 90, volume: 1000000 },
      ];

      const indicators = StockMapper.calculateBasicIndicators(data);

      expect(indicators.priceChange).toBe(-10);
      expect(indicators.priceChangePercent).toBe(-10);
    });

    it('should handle empty data', () => {
      const indicators = StockMapper.calculateBasicIndicators([]);

      expect(indicators).toEqual({});
    });

    it('should handle single data point', () => {
      const data = [
        { date: '2024-01-01', open: 100, high: 102, low: 98, close: 100, volume: 1000000 },
      ];

      const indicators = StockMapper.calculateBasicIndicators(data);

      expect(indicators.volatility).toBeUndefined();
      expect(indicators.priceChange).toBeUndefined();
      expect(indicators.priceChangePercent).toBeUndefined();
    });

    it('should sort data by date before calculating', () => {
      const unsortedData = [
        { date: '2024-01-03', open: 105, high: 107, low: 103, close: 106, volume: 1000000 },
        { date: '2024-01-01', open: 100, high: 102, low: 98, close: 100, volume: 1000000 },
        { date: '2024-01-02', open: 100, high: 105, low: 99, close: 105, volume: 1000000 },
      ];

      const indicators = StockMapper.calculateBasicIndicators(unsortedData);

      expect(indicators.priceChange).toBe(6); // 106 - 100
      expect(indicators.priceChangePercent).toBe(6);
    });
  });

describe('toExportFormat', () => {
  it('should format complete stock quote for export', () => {
    const quote: StockQuoteDTO = {
      symbol: 'AAPL',
      price: 175.50,
      change: 2.50,
      changePercent: 1.44,
      high: 176.00,
      low: 172.00,
      open: 173.00,
      volume: 50000000,
      lastUpdated: '2024-01-15T10:30:00Z',
    };

    const exported = StockMapper.toExportFormat(quote);

    expect(exported).toEqual({
      Symbol: 'AAPL',
      Price: 175.50,
      Change: 2.50,
      'Change %': 1.44,
      High: 176.00,
      Low: 172.00,
      Open: 173.00,
      Volume: 50000000,
      'Last Updated': '2024-01-15T10:30:00Z',
    });
  });

  it('should handle missing optional fields', () => {
    const quote: StockQuoteDTO = {
      symbol: 'GOOGL',
      price: 140.25,
      lastUpdated: '2024-01-15T11:00:00Z',
    };

    const exported = StockMapper.toExportFormat(quote);

    expect(exported).toEqual({
      Symbol: 'GOOGL',
      Price: 140.25,
      Change: 0,
      'Change %': 0,
      High: '',
      Low: '',
      Open: '',
      Volume: '',
      'Last Updated': '2024-01-15T11:00:00Z',
    });
  });

  it('should handle negative values', () => {
    const quote: StockQuoteDTO = {
      symbol: 'TSLA',
      price: 200.00,
      change: -5.00,
      changePercent: -2.44,
      lastUpdated: '2024-01-15T12:00:00Z',
    };

    const exported = StockMapper.toExportFormat(quote);

    expect(exported.Change).toBe(-5.00);
    expect(exported['Change %']).toBe(-2.44);
  });

  it('should handle zero values correctly', () => {
    const quote: StockQuoteDTO = {
      symbol: 'META',
      price: 350.00,
      change: 0,
      changePercent: 0,
      high: 0,
      low: 0,
      open: 0,
      volume: 0,
      lastUpdated: '2024-01-15T13:00:00Z',
    };

    const exported = StockMapper.toExportFormat(quote);

    expect(exported.Change).toBe(0);
    expect(exported['Change %']).toBe(0);
    expect(exported.High).toBe(0);
    expect(exported.Low).toBe(0);
    expect(exported.Open).toBe(0);
    expect(exported.Volume).toBe(0);
  });

  it('should distinguish between zero and undefined', () => {
    const quoteWithZeros: StockQuoteDTO = {
      symbol: 'TEST1',
      price: 100,
      change: 0,
      volume: 0,
      lastUpdated: '2024-01-15',
    };

    const quoteWithUndefined: StockQuoteDTO = {
      symbol: 'TEST2',
      price: 100,
      change: undefined,
      volume: undefined,
      lastUpdated: '2024-01-15',
    };

    const exportedZeros = StockMapper.toExportFormat(quoteWithZeros);
    const exportedUndefined = StockMapper.toExportFormat(quoteWithUndefined);

    expect(exportedZeros.Change).toBe(0);
    expect(exportedZeros.Volume).toBe(0);
    
    expect(exportedUndefined.Change).toBe(0); // Defaults to 0
    expect(exportedUndefined.Volume).toBe(''); // Defaults to empty string
  });
});

  describe('Edge cases and error handling', () => {
    it('should handle very large numbers', () => {
      const largeQuote: StockQuote = {
        symbol: 'BRK.A',
        price: 550000.00,
        lastUpdated: '2024-01-15T10:00:00Z',
      };

      const dto = StockMapper.toDTO(largeQuote);

      expect(dto.price).toBe(550000.00);
    });

    it('should handle very small decimal prices', () => {
      const smallQuote: StockQuote = {
        symbol: 'PENNY',
        price: 0.0001,
        lastUpdated: '2024-01-15T10:00:00Z',
      };

      const dto = StockMapper.toDTO(smallQuote);

      expect(dto.price).toBe(0.0001);
    });

    it('should handle special characters in symbol sanitization', () => {
      expect(StockMapper.sanitizeSymbol('BRK.A')).toBe('BRKA');
      expect(StockMapper.sanitizeSymbol('BRK-B')).toBe('BRKB');
      expect(StockMapper.sanitizeSymbol('TD:CA')).toBe('TDCA');
    });

    it('should handle date edge cases in historical data', () => {
      const data = [
        { date: '2024-12-31', open: 100, high: 102, low: 98, close: 101, volume: 1000000 },
        { date: '2025-01-01', open: 101, high: 103, low: 100, close: 102, volume: 1000000 },
      ];

      const indicators = StockMapper.calculateBasicIndicators(data);

      expect(indicators.priceChange).toBe(1);
    });
  });
});