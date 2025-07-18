import type { Trade, TradeFormData } from '../types';
import type { 
  TradeDTO, 
  CreateTradeDTO, 
  UpdateTradeDTO, 
  TradeListResponseDTO 
} from '../dto';
import { tradeService } from '../services';

/**
 * Mapper class for Trade entities
 */
export class TradeMapper {
  /**
   * Maps a domain Trade model to a TradeDTO
   */
  static toDTO(trade: Trade, currentPrice?: number): TradeDTO {
    const isOpen = tradeService.isTradeOpen(trade);
    const gain = tradeService.calculateGain(trade);
    const currentValue = currentPrice 
      ? trade.quantity * currentPrice 
      : (trade.sellPrice ? trade.quantity * trade.sellPrice : undefined);
    
    const initialValue = trade.quantity * trade.buyPrice;
    const gainPercentage = initialValue > 0 && currentValue 
      ? ((currentValue - initialValue) / initialValue) * 100 
      : undefined;
    
    return {
      ...trade,
      currentValue,
      gain,
      gainPercentage,
      isOpen
    };
  }

  /**
   * Maps a list of domain Trade models to TradeListResponseDTO
   */
  static toListResponseDTO(trades: Trade[], currentPrices?: Map<string, number>): TradeListResponseDTO {
    const tradeDTOs = trades.map(trade => {
      const currentPrice = currentPrices?.get(trade.symbol);
      return this.toDTO(trade, currentPrice);
    });

    const totalValue = tradeDTOs.reduce((sum, trade) => 
      sum + (trade.currentValue || 0), 0);
    
    const totalGain = tradeDTOs.reduce((sum, trade) => 
      sum + (trade.gain || 0), 0);

    return {
      trades: tradeDTOs,
      totalCount: tradeDTOs.length,
      totalValue,
      totalGain
    };
  }

  /**
   * Maps CreateTradeDTO to domain TradeFormData
   */
  static fromCreateDTO(dto: CreateTradeDTO): TradeFormData {
    return {
      symbol: dto.symbol,
      quantity: dto.quantity,
      buyPrice: dto.buyPrice
    };
  }

  /**
   * Maps domain Trade to a new Trade with updates applied
   */
  static applyUpdates(trade: Trade, updates: UpdateTradeDTO): Trade {
    const result = { ...trade };
    
    if (updates.sellPrice !== undefined) {
      result.sellPrice = updates.sellPrice;
    }
    
    if (updates.sellDate !== undefined) {
      result.sellDate = updates.sellDate;
    }
    
    if (updates.quantity !== undefined) {
      result.quantity = updates.quantity;
    }
    
    if (updates.buyPrice !== undefined) {
      result.buyPrice = updates.buyPrice;
    }
    
    return result;
  }
}
