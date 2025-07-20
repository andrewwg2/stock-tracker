/**
 * Trade Mapper
 * Handles mapping between Trade domain models and DTOs
 */

import type { Trade, TradeFormData } from '../types';
import type { 
  TradeDTO, 
  CreateTradeDTO, 
  UpdateTradeDTO, 
  TradeListResponseDTO 
} from '../dto';

export class TradeMapper {
  /**
   * Maps a domain Trade model to a TradeDTO
   */
  static toDTO(trade: Trade, currentPrice?: number): TradeDTO {
    const isOpen = !trade.sellPrice;
    const gain = trade.sellPrice ? (trade.sellPrice - trade.buyPrice) * trade.quantity : 0;
    
    let currentValue: number;
    if (trade.sellPrice) {
      currentValue = trade.sellPrice * trade.quantity;
    } else if (currentPrice) {
      currentValue = currentPrice * trade.quantity;
    } else {
      currentValue = trade.buyPrice * trade.quantity;
    }
    
    const initialValue = trade.buyPrice * trade.quantity;
    const gainPercentage = initialValue > 0 && currentValue !== initialValue
      ? ((currentValue - initialValue) / initialValue) * 100 
      : 0;
    
    // For unrealized gains, calculate based on current price vs buy price
    const unrealizedGain = isOpen && currentPrice 
      ? (currentPrice - trade.buyPrice) * trade.quantity 
      : 0;

    return {
      id: trade.id,
      symbol: trade.symbol,
      quantity: trade.quantity,
      buyPrice: trade.buyPrice,
      buyDate: trade.buyDate,
      sellPrice: trade.sellPrice,
      sellDate: trade.sellDate,
      currentValue,
      gain: isOpen ? unrealizedGain : gain,
      gainPercentage,
      isOpen,
    };
  }

  /**
   * Maps a list of domain Trade models to TradeListResponseDTO
   */
  static toListResponseDTO(
    trades: Trade[], 
    currentPrices?: Map<string, number>
  ): TradeListResponseDTO {
    const tradeDTOs = trades.map(trade => {
      const currentPrice = currentPrices?.get(trade.symbol);
      return this.toDTO(trade, currentPrice);
    });

    const totalValue = tradeDTOs.reduce((sum, trade) => 
      sum + (trade.currentValue || 0), 0);
    
    const totalGain = tradeDTOs.reduce((sum, trade) => 
      sum + (trade.gain || 0), 0);

    const realizedGain = tradeDTOs
      .filter(trade => !trade.isOpen)
      .reduce((sum, trade) => sum + (trade.gain || 0), 0);

    const unrealizedGain = tradeDTOs
      .filter(trade => trade.isOpen)
      .reduce((sum, trade) => sum + (trade.gain || 0), 0);

    return {
      trades: tradeDTOs,
      totalCount: tradeDTOs.length,
      totalValue,
      totalGain,
      realizedGain,
      unrealizedGain,
      openPositions: tradeDTOs.filter(trade => trade.isOpen).length,
      closedPositions: tradeDTOs.filter(trade => !trade.isOpen).length,
    };
  }

  /**
   * Maps CreateTradeDTO to domain TradeFormData
   */
  static fromCreateDTO(dto: CreateTradeDTO): TradeFormData {
    return {
      symbol: dto.symbol.toUpperCase().trim(),
      quantity: Number(dto.quantity),
      buyPrice: Number(dto.buyPrice),
    };
  }

  /**
   * Maps domain Trade to a new Trade with updates applied
   */
  static applyUpdates(trade: Trade, updates: UpdateTradeDTO): Trade {
    const result: Trade = { ...trade };
    
    if (updates.sellPrice !== undefined) {
      result.sellPrice = Number(updates.sellPrice);
    }
    
    if (updates.sellDate !== undefined) {
      result.sellDate = updates.sellDate;
    }
    
    if (updates.quantity !== undefined) {
      result.quantity = Number(updates.quantity);
    }
    
    if (updates.buyPrice !== undefined) {
      result.buyPrice = Number(updates.buyPrice);
    }
    
    return result;
  }

  /**
   * Maps TradeDTO back to domain Trade model
   */
  static fromDTO(dto: TradeDTO): Trade {
    return {
      id: dto.id,
      symbol: dto.symbol,
      quantity: dto.quantity,
      buyPrice: dto.buyPrice,
      buyDate: dto.buyDate,
      sellPrice: dto.sellPrice,
      sellDate: dto.sellDate,
    };
  }

  /**
   * Validates and sanitizes CreateTradeDTO
   */
  static validateCreateDTO(dto: CreateTradeDTO): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!dto.symbol || !dto.symbol.trim()) {
      errors.push('Symbol is required');
    } else {
      const cleanSymbol = dto.symbol.trim().toUpperCase();
      if (!/^[A-Z]{1,5}$/.test(cleanSymbol)) {
        errors.push('Symbol must be 1-5 letters');
      }
    }
    
    if (!dto.quantity || dto.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    } else if (!Number.isInteger(dto.quantity)) {
      errors.push('Quantity must be a whole number');
    }
    
    if (!dto.buyPrice || dto.buyPrice <= 0) {
      errors.push('Buy price must be greater than 0');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitizes CreateTradeDTO by cleaning up the data
   */
  static sanitizeCreateDTO(dto: CreateTradeDTO): CreateTradeDTO {
    return {
      symbol: dto.symbol.trim().toUpperCase(),
      quantity: Math.floor(Math.abs(dto.quantity || 1)),
      buyPrice: Math.abs(dto.buyPrice || 0),
    };
  }

  /**
   * Maps trade for export (CSV/JSON)
   */
  static toExportFormat(trade: Trade, includeGain: boolean = true): Record<string, any> {
    const baseData = {
      Symbol: trade.symbol,
      Quantity: trade.quantity,
      'Buy Price': trade.buyPrice,
      'Buy Date': trade.buyDate,
      'Sell Price': trade.sellPrice || '',
      'Sell Date': trade.sellDate || '',
    };

    if (includeGain && trade.sellPrice) {
      const gain = (trade.sellPrice - trade.buyPrice) * trade.quantity;
      const gainPercentage = ((trade.sellPrice - trade.buyPrice) / trade.buyPrice) * 100;
      
      return {
        ...baseData,
        'Gain ($)': gain,
        'Gain (%)': gainPercentage,
      };
    }

    return baseData;
  }

  /**
   * Bulk conversion utility
   */
  static toDTOs(trades: Trade[], currentPrices?: Map<string, number>): TradeDTO[] {
    return trades.map(trade => {
      const currentPrice = currentPrices?.get(trade.symbol);
      return this.toDTO(trade, currentPrice);
    });
  }

  /**
   * Bulk conversion from DTOs to domain models
   */
  static fromDTOs(dtos: TradeDTO[]): Trade[] {
    return dtos.map(dto => this.fromDTO(dto));
  }
}
