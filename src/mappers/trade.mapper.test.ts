// TradeMapper.test.ts

import { describe, it, expect } from 'vitest';
import { TradeMapper } from './trade.mapper';
import type { Trade, TradeFormData } from '../types';
import type { 
  TradeDTO, 
  CreateTradeDTO, 
  UpdateTradeDTO 
} from '../dto';

describe('TradeMapper', () => {
  // Sample test data
  const openTrade: Trade = {
    id: '1',
    symbol: 'AAPL',
    quantity: 10,
    buyPrice: 150,
    buyDate: '2024-01-01',
    sellPrice: undefined,
    sellDate: undefined,
  };

  const closedTrade: Trade = {
    id: '2',
    symbol: 'GOOGL',
    quantity: 5,
    buyPrice: 100,
    buyDate: '2024-01-01',
    sellPrice: 120,
    sellDate: '2024-02-01',
  };

  describe('toDTO', () => {
    it('should map open trade without current price', () => {
      const dto = TradeMapper.toDTO(openTrade);

      expect(dto).toEqual({
        id: '1',
        symbol: 'AAPL',
        quantity: 10,
        buyPrice: 150,
        buyDate: '2024-01-01',
        sellPrice: undefined,
        sellDate: undefined,
        currentValue: 1500, // buyPrice * quantity
        gain: 0,
        gainPercentage: 0,
        isOpen: true,
      });
    });

    it('should map open trade with current price', () => {
      const currentPrice = 180;
      const dto = TradeMapper.toDTO(openTrade, currentPrice);

      expect(dto).toEqual({
        id: '1',
        symbol: 'AAPL',
        quantity: 10,
        buyPrice: 150,
        buyDate: '2024-01-01',
        sellPrice: undefined,
        sellDate: undefined,
        currentValue: 1800, // currentPrice * quantity
        gain: 300, // (180 - 150) * 10
        gainPercentage: 20, // ((1800 - 1500) / 1500) * 100
        isOpen: true,
      });
    });

    it('should map closed trade', () => {
      const dto = TradeMapper.toDTO(closedTrade);

      expect(dto).toEqual({
        id: '2',
        symbol: 'GOOGL',
        quantity: 5,
        buyPrice: 100,
        buyDate: '2024-01-01',
        sellPrice: 120,
        sellDate: '2024-02-01',
        currentValue: 600, // sellPrice * quantity
        gain: 100, // (120 - 100) * 5
        gainPercentage: 20, // ((600 - 500) / 500) * 100
        isOpen: false,
      });
    });

    it('should handle closed trade with current price (should ignore current price)', () => {
      const dto = TradeMapper.toDTO(closedTrade, 200);

      expect(dto.currentValue).toBe(600); // Still uses sellPrice
      expect(dto.gain).toBe(100); // Realized gain
      expect(dto.isOpen).toBe(false);
    });

    it('should handle trade with zero initial value', () => {
      const zeroValueTrade: Trade = {
        ...openTrade,
        buyPrice: 0,
      };

      const dto = TradeMapper.toDTO(zeroValueTrade, 100);

      expect(dto.gainPercentage).toBe(0);
      expect(dto.currentValue).toBe(1000);
    });

    it('should handle negative gains correctly', () => {
      const dto = TradeMapper.toDTO(openTrade, 120); // Current price lower than buy price

      expect(dto.gain).toBe(-300); // (120 - 150) * 10
      expect(dto.gainPercentage).toBe(-20); // -20% loss
      expect(dto.currentValue).toBe(1200);
    });
  });

  describe('toListResponseDTO', () => {
    it('should map list of trades without current prices', () => {
      const trades = [openTrade, closedTrade];
      const response = TradeMapper.toListResponseDTO(trades);

      expect(response.trades).toHaveLength(2);
      expect(response.totalCount).toBe(2);
      expect(response.totalValue).toBe(2100); // 1500 + 600
      expect(response.totalGain).toBe(100); // 0 + 100
      expect(response.realizedGain).toBe(100);
      expect(response.unrealizedGain).toBe(0);
      expect(response.openPositions).toBe(1);
      expect(response.closedPositions).toBe(1);
    });

    it('should map list of trades with current prices', () => {
      const trades = [openTrade, closedTrade];
      const currentPrices = new Map([
        ['AAPL', 180],
        ['GOOGL', 150], // Should be ignored for closed trade
      ]);

      const response = TradeMapper.toListResponseDTO(trades, currentPrices);

      expect(response.totalValue).toBe(2400); // 1800 + 600
      expect(response.totalGain).toBe(400); // 300 + 100
      expect(response.realizedGain).toBe(100);
      expect(response.unrealizedGain).toBe(300);
    });

    it('should handle empty trade list', () => {
      const response = TradeMapper.toListResponseDTO([]);

      expect(response.trades).toEqual([]);
      expect(response.totalCount).toBe(0);
      expect(response.totalValue).toBe(0);
      expect(response.totalGain).toBe(0);
      expect(response.realizedGain).toBe(0);
      expect(response.unrealizedGain).toBe(0);
      expect(response.openPositions).toBe(0);
      expect(response.closedPositions).toBe(0);
    });

    it('should handle trades with missing current prices', () => {
      const trades = [openTrade];
      const currentPrices = new Map([
        ['TSLA', 200], // Different symbol
      ]);

      const response = TradeMapper.toListResponseDTO(trades, currentPrices);

      expect(response.trades[0].currentValue).toBe(1500);
      expect(response.trades[0].gain).toBe(0);
    });

    it('should handle mixed gains and losses', () => {
      const losingTrade: Trade = {
        ...openTrade,
        id: '3',
        symbol: 'META',
      };

      const trades = [openTrade, closedTrade, losingTrade];
      const currentPrices = new Map([
        ['AAPL', 180], // +30 per share
        ['META', 100], // -50 per share
      ]);

      const response = TradeMapper.toListResponseDTO(trades, currentPrices);

      expect(response.unrealizedGain).toBe(-200); // 300 + (-500)
      expect(response.realizedGain).toBe(100);
      expect(response.totalGain).toBe(-100); // -200 + 100
    });
  });

  describe('fromCreateDTO', () => {
    it('should map CreateTradeDTO to TradeFormData', () => {
      const dto: CreateTradeDTO = {
        symbol: 'aapl',
        quantity: 10,
        buyPrice: 150,
      };

      const formData = TradeMapper.fromCreateDTO(dto);

      expect(formData).toEqual({
        symbol: 'AAPL',
        quantity: 10,
        buyPrice: 150,
      });
    });

    it('should trim and uppercase symbol', () => {
      const dto: CreateTradeDTO = {
        symbol: '  tsla  ',
        quantity: 5,
        buyPrice: 200,
      };

      const formData = TradeMapper.fromCreateDTO(dto);

      expect(formData.symbol).toBe('TSLA');
    });

    it('should convert string numbers to numbers', () => {
      const dto: CreateTradeDTO = {
        symbol: 'GOOGL',
        quantity: '5' as any,
        buyPrice: '100.50' as any,
      };

      const formData = TradeMapper.fromCreateDTO(dto);

      expect(formData.quantity).toBe(5);
      expect(formData.buyPrice).toBe(100.5);
    });
  });

  describe('applyUpdates', () => {
    it('should apply sell price and date updates', () => {
      const updates: UpdateTradeDTO = {
        sellPrice: 200,
        sellDate: '2024-03-01',
      };

      const updatedTrade = TradeMapper.applyUpdates(openTrade, updates);

      expect(updatedTrade.sellPrice).toBe(200);
      expect(updatedTrade.sellDate).toBe('2024-03-01');
      expect(updatedTrade.id).toBe(openTrade.id); // Unchanged
      expect(updatedTrade.symbol).toBe(openTrade.symbol); // Unchanged
    });

    it('should apply quantity and buy price updates', () => {
      const updates: UpdateTradeDTO = {
        quantity: 20,
        buyPrice: 140,
      };

      const updatedTrade = TradeMapper.applyUpdates(openTrade, updates);

      expect(updatedTrade.quantity).toBe(20);
      expect(updatedTrade.buyPrice).toBe(140);
    });

    it('should handle empty updates', () => {
      const updatedTrade = TradeMapper.applyUpdates(openTrade, {});

      expect(updatedTrade).toEqual(openTrade);
    });

    it('should convert string numbers in updates', () => {
      const updates: UpdateTradeDTO = {
        sellPrice: '250.50' as any,
        quantity: '15' as any,
      };

      const updatedTrade = TradeMapper.applyUpdates(openTrade, updates);

      expect(updatedTrade.sellPrice).toBe(250.5);
      expect(updatedTrade.quantity).toBe(15);
    });

    it('should not mutate original trade', () => {
      const originalTrade = { ...openTrade };
      const updates: UpdateTradeDTO = { sellPrice: 200 };

      TradeMapper.applyUpdates(openTrade, updates);

      expect(openTrade).toEqual(originalTrade);
    });

    it('should handle undefined values in updates', () => {
      const updates: UpdateTradeDTO = {
        sellPrice: undefined,
        sellDate: '2024-03-01',
      };

      const updatedTrade = TradeMapper.applyUpdates(openTrade, updates);

      expect(updatedTrade.sellPrice).toBeUndefined();
      expect(updatedTrade.sellDate).toBe('2024-03-01');
    });
  });

  describe('fromDTO', () => {
    it('should map TradeDTO to Trade model', () => {
      const dto: TradeDTO = {
        id: '1',
        symbol: 'AAPL',
        quantity: 10,
        buyPrice: 150,
        buyDate: '2024-01-01',
        sellPrice: 180,
        sellDate: '2024-02-01',
        currentValue: 1800,
        gain: 300,
        gainPercentage: 20,
        isOpen: false,
      };

      const trade = TradeMapper.fromDTO(dto);

      expect(trade).toEqual({
        id: '1',
        symbol: 'AAPL',
        quantity: 10,
        buyPrice: 150,
        buyDate: '2024-01-01',
        sellPrice: 180,
        sellDate: '2024-02-01',
      });
    });

    it('should handle open trade DTO', () => {
      const dto: TradeDTO = {
        id: '2',
        symbol: 'TSLA',
        quantity: 5,
        buyPrice: 200,
        buyDate: '2024-01-01',
        sellPrice: undefined,
        sellDate: undefined,
        currentValue: 1000,
        gain: 0,
        gainPercentage: 0,
        isOpen: true,
      };

      const trade = TradeMapper.fromDTO(dto);

      expect(trade.sellPrice).toBeUndefined();
      expect(trade.sellDate).toBeUndefined();
    });
  });

  describe('validateCreateDTO', () => {
    it('should validate valid DTO', () => {
      const dto: CreateTradeDTO = {
        symbol: 'AAPL',
        quantity: 10,
        buyPrice: 150,
      };

      const result = TradeMapper.validateCreateDTO(dto);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject empty symbol', () => {
      const dto: CreateTradeDTO = {
        symbol: '',
        quantity: 10,
        buyPrice: 150,
      };

      const result = TradeMapper.validateCreateDTO(dto);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Symbol is required');
    });

    it('should reject symbol with only spaces', () => {
      const dto: CreateTradeDTO = {
        symbol: '   ',
        quantity: 10,
        buyPrice: 150,
      };

      const result = TradeMapper.validateCreateDTO(dto);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Symbol is required');
    });

    it('should reject invalid symbol format', () => {
      const dto: CreateTradeDTO = {
        symbol: 'TOOLONG',
        quantity: 10,
        buyPrice: 150,
      };

      const result = TradeMapper.validateCreateDTO(dto);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Symbol must be 1-5 letters');
    });

    it('should reject symbol with numbers', () => {
      const dto: CreateTradeDTO = {
        symbol: 'AAP1',
        quantity: 10,
        buyPrice: 150,
      };

      const result = TradeMapper.validateCreateDTO(dto);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Symbol must be 1-5 letters');
    });

    it('should accept valid symbol variations', () => {
      const validSymbols = ['A', 'AA', 'AAPL', 'GOOGL'];
      
      validSymbols.forEach(symbol => {
        const dto: CreateTradeDTO = {
          symbol,
          quantity: 10,
          buyPrice: 150,
        };

        const result = TradeMapper.validateCreateDTO(dto);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject zero or negative quantity', () => {
      const dto: CreateTradeDTO = {
        symbol: 'AAPL',
        quantity: 0,
        buyPrice: 150,
      };

      const result = TradeMapper.validateCreateDTO(dto);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Quantity must be greater than 0');
    });

    it('should reject non-integer quantity', () => {
      const dto: CreateTradeDTO = {
        symbol: 'AAPL',
        quantity: 10.5,
        buyPrice: 150,
      };

      const result = TradeMapper.validateCreateDTO(dto);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Quantity must be a whole number');
    });

    it('should reject zero or negative buy price', () => {
      const dto: CreateTradeDTO = {
        symbol: 'AAPL',
        quantity: 10,
        buyPrice: 0,
      };

      const result = TradeMapper.validateCreateDTO(dto);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Buy price must be greater than 0');
    });

    it('should collect multiple errors', () => {
      const dto: CreateTradeDTO = {
        symbol: '',
        quantity: -5,
        buyPrice: -100,
      };

      const result = TradeMapper.validateCreateDTO(dto);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('Symbol is required');
      expect(result.errors).toContain('Quantity must be greater than 0');
      expect(result.errors).toContain('Buy price must be greater than 0');
    });

    it('should handle missing values', () => {
      const dto: CreateTradeDTO = {
        symbol: 'AAPL',
        quantity: null as any,
        buyPrice: undefined as any,
      };

      const result = TradeMapper.validateCreateDTO(dto);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Quantity must be greater than 0');
      expect(result.errors).toContain('Buy price must be greater than 0');
    });
  });

  describe('sanitizeCreateDTO', () => {
    it('should sanitize valid DTO', () => {
      const dto: CreateTradeDTO = {
        symbol: '  aapl  ',
        quantity: 10.7,
        buyPrice: 150.50,
      };

      const sanitized = TradeMapper.sanitizeCreateDTO(dto);

      expect(sanitized).toEqual({
        symbol: 'AAPL',
        quantity: 10,
        buyPrice: 150.50,
      });
    });

    it('should handle negative values', () => {
      const dto: CreateTradeDTO = {
        symbol: 'TSLA',
        quantity: -10,
        buyPrice: -200,
      };

      const sanitized = TradeMapper.sanitizeCreateDTO(dto);

      expect(sanitized.quantity).toBe(10);
      expect(sanitized.buyPrice).toBe(200);
    });

    it('should handle undefined/null values', () => {
      const dto: CreateTradeDTO = {
        symbol: 'AAPL',
        quantity: null as any,
        buyPrice: undefined as any,
      };

      const sanitized = TradeMapper.sanitizeCreateDTO(dto);

      expect(sanitized.quantity).toBe(1); // Default fallback
      expect(sanitized.buyPrice).toBe(0); // Default fallback
    });

    it('should floor quantity to whole number', () => {
      const dto: CreateTradeDTO = {
        symbol: 'AAPL',
        quantity: 15.9,
        buyPrice: 150,
      };

      const sanitized = TradeMapper.sanitizeCreateDTO(dto);

      expect(sanitized.quantity).toBe(15);
    });
  });

  describe('toExportFormat', () => {
    it('should export open trade without gains', () => {
      const exported = TradeMapper.toExportFormat(openTrade);

      expect(exported).toEqual({
        Symbol: 'AAPL',
        Quantity: 10,
        'Buy Price': 150,
        'Buy Date': '2024-01-01',
        'Sell Price': '',
        'Sell Date': '',
      });
    });

    it('should export closed trade with gains', () => {
      const exported = TradeMapper.toExportFormat(closedTrade, true);

      expect(exported).toEqual({
        Symbol: 'GOOGL',
        Quantity: 5,
        'Buy Price': 100,
        'Buy Date': '2024-01-01',
        'Sell Price': 120,
        'Sell Date': '2024-02-01',
        'Gain ($)': 100,
        'Gain (%)': 20,
      });
    });

    it('should export closed trade without gains when includeGain is false', () => {
      const exported = TradeMapper.toExportFormat(closedTrade, false);

      expect(exported).not.toHaveProperty('Gain ($)');
      expect(exported).not.toHaveProperty('Gain (%)');
    });

    it('should handle negative gains', () => {
      const losingTrade: Trade = {
        ...closedTrade,
        sellPrice: 80, // Loss
      };

      const exported = TradeMapper.toExportFormat(losingTrade, true);

      expect(exported['Gain ($)']).toBe(-100); // (80 - 100) * 5
      expect(exported['Gain (%)']).toBe(-20); // -20%
    });
  });

  describe('toDTOs', () => {
    it('should convert array of trades to DTOs', () => {
      const trades = [openTrade, closedTrade];
      const dtos = TradeMapper.toDTOs(trades);

      expect(dtos).toHaveLength(2);
      expect(dtos[0].symbol).toBe('AAPL');
      expect(dtos[1].symbol).toBe('GOOGL');
      expect(dtos[0].isOpen).toBe(true);
      expect(dtos[1].isOpen).toBe(false);
    });

    it('should handle empty array', () => {
      const dtos = TradeMapper.toDTOs([]);
      expect(dtos).toEqual([]);
    });

    it('should use current prices when provided', () => {
      const trades = [openTrade];
      const currentPrices = new Map([['AAPL', 200]]);
      
      const dtos = TradeMapper.toDTOs(trades, currentPrices);

      expect(dtos[0].currentValue).toBe(2000);
      expect(dtos[0].gain).toBe(500);
    });
  });

  describe('fromDTOs', () => {
    it('should convert array of DTOs to trades', () => {
      const dtos: TradeDTO[] = [
        {
          id: '1',
          symbol: 'AAPL',
          quantity: 10,
          buyPrice: 150,
          buyDate: '2024-01-01',
          sellPrice: undefined,
          sellDate: undefined,
          currentValue: 1500,
          gain: 0,
          gainPercentage: 0,
          isOpen: true,
        },
      ];

      const trades = TradeMapper.fromDTOs(dtos);

      expect(trades).toHaveLength(1);
      expect(trades[0]).toEqual({
        id: '1',
        symbol: 'AAPL',
        quantity: 10,
        buyPrice: 150,
        buyDate: '2024-01-01',
        sellPrice: undefined,
        sellDate: undefined,
      });
    });

    it('should handle empty array', () => {
      const trades = TradeMapper.fromDTOs([]);
      expect(trades).toEqual([]);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle very small numbers', () => {
      const microTrade: Trade = {
        id: '1',
        symbol: 'PENNY',
        quantity: 1000000,
        buyPrice: 0.001,
        buyDate: '2024-01-01',
        sellPrice: 0.002,
        sellDate: '2024-02-01',
      };

      const dto = TradeMapper.toDTO(microTrade);

      expect(dto.gain).toBe(1000); // (0.002 - 0.001) * 1000000
      expect(dto.gainPercentage).toBe(100);
    });

    it('should handle very large numbers', () => {
      const largeTrade: Trade = {
        id: '1',
        symbol: 'BRK',
        quantity: 1,
        buyPrice: 400000,
        buyDate: '2024-01-01',
        sellPrice: 450000,
        sellDate: '2024-02-01',
      };

      const dto = TradeMapper.toDTO(largeTrade);

      expect(dto.gain).toBe(50000);
      expect(dto.gainPercentage).toBe(12.5);
    });
  });
});