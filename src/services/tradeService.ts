import type { Trade, TradeFormData } from '../types';
import type { 
  CreateTradeDTO, 
  UpdateTradeDTO, 
  TradeDTO, 
  TradeFilterDTO, 
  TradeListResponseDTO 
} from '../dto';
import { TradeMapper } from '../mappers';

/**
 * Enhanced Trade Service interface with DTO support
 */
export interface TradeService {
  // Original methods
  createTrade(formData: TradeFormData): Trade;
  sellTrade(trade: Trade, sellPrice: number): Trade;
  calculateGain(trade: Trade): number;
  calculateTotalGain(trades: Trade[]): number;
  isTradeOpen(trade: Trade): boolean;
  getClosedTrades(trades: Trade[]): Trade[];
  
  // New DTO-based methods
  createTradeFromDTO(dto: CreateTradeDTO): TradeDTO;
  updateTrade(id: string, updates: UpdateTradeDTO, trades: Trade[]): TradeDTO | null;
  getTradesWithFilter(trades: Trade[], filter: TradeFilterDTO, currentPrices?: Map<string, number>): TradeListResponseDTO;
  getTradeById(id: string, trades: Trade[], currentPrice?: number): TradeDTO | null;
}

class TradeServiceImpl implements TradeService {
  // Original methods
  createTrade(formData: TradeFormData): Trade {
    return {
      id: this.generateId(),
      symbol: formData.symbol.toUpperCase(),
      quantity: formData.quantity,
      buyPrice: formData.buyPrice,
      buyDate: new Date().toLocaleDateString(),
    };
  }

  sellTrade(trade: Trade, sellPrice: number): Trade {
    return {
      ...trade,
      sellPrice,
      sellDate: new Date().toLocaleDateString(),
    };
  }

  calculateGain(trade: Trade): number {
    if (!trade.sellPrice) return 0;
    return (trade.sellPrice - trade.buyPrice) * trade.quantity;
  }

  calculateTotalGain(trades: Trade[]): number {
    return trades.reduce((total, trade) => total + this.calculateGain(trade), 0);
  }

  isTradeOpen(trade: Trade): boolean {
    return !trade.sellPrice || !trade.sellDate;
  }

  getClosedTrades(trades: Trade[]): Trade[] {
    return trades.filter(trade => !this.isTradeOpen(trade));
  }

  // New DTO-based methods
  createTradeFromDTO(dto: CreateTradeDTO): TradeDTO {
    const formData = TradeMapper.fromCreateDTO(dto);
    const trade = this.createTrade(formData);
    return TradeMapper.toDTO(trade);
  }

  updateTrade(id: string, updates: UpdateTradeDTO, trades: Trade[]): TradeDTO | null {
    const tradeIndex = trades.findIndex(trade => trade.id === id);
    
    if (tradeIndex === -1) return null;
    
    const updatedTrade = TradeMapper.applyUpdates(trades[tradeIndex], updates);
    
    // If we're setting a sell price and there's no sell date, add the sell date
    if (updates.sellPrice !== undefined && updatedTrade.sellPrice && !updatedTrade.sellDate) {
      updatedTrade.sellDate = new Date().toLocaleDateString();
    }
    
    return TradeMapper.toDTO(updatedTrade);
  }

  getTradesWithFilter(trades: Trade[], filter: TradeFilterDTO, currentPrices?: Map<string, number>): TradeListResponseDTO {
    let filteredTrades = [...trades];
    
    // Apply symbol filter
    if (filter.symbol) {
      filteredTrades = filteredTrades.filter(trade => 
        trade.symbol.toUpperCase() === filter.symbol?.toUpperCase()
      );
    }
    
    // Apply open/closed filters
    if (filter.openOnly) {
      filteredTrades = filteredTrades.filter(trade => this.isTradeOpen(trade));
    } else if (filter.closedOnly) {
      filteredTrades = filteredTrades.filter(trade => !this.isTradeOpen(trade));
    }
    
    // Apply date filters
    if (filter.dateFrom) {
      const fromDate = new Date(filter.dateFrom).getTime();
      filteredTrades = filteredTrades.filter(trade => 
        new Date(trade.buyDate).getTime() >= fromDate
      );
    }
    
    if (filter.dateTo) {
      const toDate = new Date(filter.dateTo).getTime();
      filteredTrades = filteredTrades.filter(trade => 
        new Date(trade.buyDate).getTime() <= toDate
      );
    }
    
    return TradeMapper.toListResponseDTO(filteredTrades, currentPrices);
  }

  getTradeById(id: string, trades: Trade[], currentPrice?: number): TradeDTO | null {
    const trade = trades.find(trade => trade.id === id);
    if (!trade) return null;
    
    return TradeMapper.toDTO(trade, currentPrice);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Export singleton instance
export const tradeService: TradeService = new TradeServiceImpl();
