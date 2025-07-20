/**
 * Trade Service
 * Handles business logic for trade operations and calculations
 */

import type { Trade, TradeFormData } from '../types';
import type { 
  CreateTradeDTO, 
  UpdateTradeDTO, 
  TradeDTO, 
  TradeFilterDTO, 
  TradeListResponseDTO,
  TradeStatsDTO 
} from '../dto';
import { calculateTotalGain, calculateTradeGainPercentage } from '../utils';

export interface TradeService {
  // Core trade operations
  createTrade(formData: TradeFormData): Trade;
  createTradeFromDTO(dto: CreateTradeDTO): TradeDTO;
  updateTrade(id: string, updates: UpdateTradeDTO, trades: Trade[]): TradeDTO | null;
  
  // Trade calculations
  calculateGain(trade: Trade): number;
  calculateTotalGain(trades: Trade[]): number;
  calculateStats(trades: TradeDTO[]): TradeStatsDTO;
  
  // Trade queries
  isTradeOpen(trade: Trade): boolean;
  getClosedTrades(trades: Trade[]): Trade[];
  getOpenTrades(trades: Trade[]): Trade[];
  getTradeById(id: string, trades: Trade[], currentPrice?: number): TradeDTO | null;
  
  // Filtering and sorting
  getTradesWithFilter(
    trades: Trade[], 
    filter: TradeFilterDTO, 
    currentPrices?: Map<string, number>
  ): TradeListResponseDTO;
  
  // Utilities
  generateId(): string;
  validateTradeData(data: TradeFormData): { isValid: boolean; errors: string[] };
}

class TradeServiceImpl implements TradeService {
  createTrade(formData: TradeFormData): Trade {
    if (!this.isValidTradeData(formData)) {
      throw new Error('Invalid trade data');
    }

    return {
      id: this.generateId(),
      symbol: formData.symbol.toUpperCase().trim(),
      quantity: Number(formData.quantity),
      buyPrice: Number(formData.buyPrice),
      buyDate: new Date().toLocaleDateString(),
    };
  }

  createTradeFromDTO(dto: CreateTradeDTO): TradeDTO {
    const formData: TradeFormData = {
      symbol: dto.symbol,
      quantity: dto.quantity,
      buyPrice: dto.buyPrice,
    };
    
    const trade = this.createTrade(formData);
    return this.tradeToDTO(trade);
  }

  updateTrade(id: string, updates: UpdateTradeDTO, trades: Trade[]): TradeDTO | null {
    const tradeIndex = trades.findIndex(trade => trade.id === id);
    
    if (tradeIndex === -1) {
      return null;
    }
    
    const existingTrade = trades[tradeIndex];
    const updatedTrade: Trade = { ...existingTrade };
    
    // Apply updates
    if (updates.sellPrice !== undefined) {
      updatedTrade.sellPrice = Number(updates.sellPrice);
    }
    
    if (updates.sellDate !== undefined) {
      updatedTrade.sellDate = updates.sellDate;
    }
    
    if (updates.quantity !== undefined) {
      updatedTrade.quantity = Number(updates.quantity);
    }
    
    if (updates.buyPrice !== undefined) {
      updatedTrade.buyPrice = Number(updates.buyPrice);
    }
    
    // Auto-set sell date if sell price is provided but no sell date
    if (updatedTrade.sellPrice && !updatedTrade.sellDate) {
      updatedTrade.sellDate = new Date().toLocaleDateString();
    }
    
    return this.tradeToDTO(updatedTrade);
  }

  calculateGain(trade: Trade): number {
    if (!trade.sellPrice) {
      return 0;
    }
    
    return (trade.sellPrice - trade.buyPrice) * trade.quantity;
  }

  calculateTotalGain(trades: Trade[]): number {
    return trades.reduce((total, trade) => total + this.calculateGain(trade), 0);
  }

  calculateStats(trades: TradeDTO[]): TradeStatsDTO {
    const totalInvestment = trades.reduce((sum, trade) => 
      sum + (trade.buyPrice * trade.quantity), 0);
    
    const totalValue = trades.reduce((sum, trade) => {
      const currentValue = trade.sellPrice 
        ? trade.sellPrice * trade.quantity 
        : trade.currentValue || (trade.buyPrice * trade.quantity);
      return sum + currentValue;
    }, 0);
    
    const totalGain = totalValue - totalInvestment;
    const totalGainPercentage = totalInvestment > 0 
      ? (totalGain / totalInvestment) * 100 
      : 0;
    
    const closedTrades = trades.filter(trade => trade.sellPrice);
    const profitableTrades = closedTrades.filter(trade => (trade.gain || 0) > 0);
    const winRate = closedTrades.length > 0 
      ? (profitableTrades.length / closedTrades.length) * 100 
      : 0;
    
    const averageGainPerTrade = trades.length > 0 
      ? totalGain / trades.length 
      : 0;
    
    // Find best and worst trades
    const bestTrade = trades.reduce((best, trade) => {
      const tradeGain = trade.gain || 0;
      const bestGain = best?.gain || Number.NEGATIVE_INFINITY;
      return tradeGain > bestGain ? trade : best;
    }, null as TradeDTO | null);
    
    const worstTrade = trades.reduce((worst, trade) => {
      const tradeGain = trade.gain || 0;
      const worstGain = worst?.gain || Number.POSITIVE_INFINITY;
      return tradeGain < worstGain ? trade : worst;
    }, null as TradeDTO | null);

    return {
      totalInvestment,
      totalValue,
      totalGain,
      totalGainPercentage,
      bestTrade: bestTrade || undefined,
      worstTrade: worstTrade || undefined,
      averageGainPerTrade,
      winRate,
    };
  }

  isTradeOpen(trade: Trade): boolean {
    return !trade.sellPrice || !trade.sellDate;
  }

  getClosedTrades(trades: Trade[]): Trade[] {
    return trades.filter(trade => !this.isTradeOpen(trade));
  }

  getOpenTrades(trades: Trade[]): Trade[] {
    return trades.filter(trade => this.isTradeOpen(trade));
  }

  getTradeById(id: string, trades: Trade[], currentPrice?: number): TradeDTO | null {
    const trade = trades.find(t => t.id === id);
    if (!trade) {
      return null;
    }
    
    return this.tradeToDTO(trade, currentPrice);
  }

  getTradesWithFilter(
    trades: Trade[], 
    filter: TradeFilterDTO, 
    currentPrices?: Map<string, number>
  ): TradeListResponseDTO {
    let filteredTrades = [...trades];
    
    // Apply symbol filter
    if (filter.symbol) {
      const normalizedSymbol = filter.symbol.toUpperCase().trim();
      filteredTrades = filteredTrades.filter(trade => 
        trade.symbol.toUpperCase() === normalizedSymbol
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
    
    // Convert to DTOs with current prices
    const tradeDTOs = filteredTrades.map(trade => {
      const currentPrice = currentPrices?.get(trade.symbol);
      return this.tradeToDTO(trade, currentPrice);
    });
    
    // Apply gain filters (after converting to DTOs)
    let finalTrades = tradeDTOs;
    
    if (filter.minGain !== undefined) {
      finalTrades = finalTrades.filter(trade => (trade.gain || 0) >= filter.minGain!);
    }
    
    if (filter.maxGain !== undefined) {
      finalTrades = finalTrades.filter(trade => (trade.gain || 0) <= filter.maxGain!);
    }
    
    // Apply sorting
    if (filter.sortBy) {
      finalTrades = this.sortTrades(finalTrades, filter.sortBy, filter.sortOrder);
    }
    
    // Calculate totals
    const totalValue = finalTrades.reduce((sum, trade) => 
      sum + (trade.currentValue || 0), 0);
    
    const totalGain = finalTrades.reduce((sum, trade) => 
      sum + (trade.gain || 0), 0);

    return {
      trades: finalTrades,
      totalCount: finalTrades.length,
      totalValue,
      totalGain,
      openPositions: finalTrades.filter(t => t.isOpen).length,
      closedPositions: finalTrades.filter(t => !t.isOpen).length,
    };
  }

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  validateTradeData(data: TradeFormData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.symbol || !data.symbol.trim()) {
      errors.push('Symbol is required');
    } else if (!/^[A-Z]{1,5}$/i.test(data.symbol.trim())) {
      errors.push('Symbol must be 1-5 letters');
    }
    
    if (!data.quantity || data.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    } else if (!Number.isInteger(data.quantity)) {
      errors.push('Quantity must be a whole number');
    }
    
    if (!data.buyPrice || data.buyPrice <= 0) {
      errors.push('Buy price must be greater than 0');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Private helper methods
  private isValidTradeData(data: TradeFormData): boolean {
    return this.validateTradeData(data).isValid;
  }

  private tradeToDTO(trade: Trade, currentPrice?: number): TradeDTO {
    const isOpen = this.isTradeOpen(trade);
    const gain = this.calculateGain(trade);
    
    let currentValue: number;
    if (trade.sellPrice) {
      currentValue = trade.sellPrice * trade.quantity;
    } else if (currentPrice) {
      currentValue = currentPrice * trade.quantity;
    } else {
      currentValue = trade.buyPrice * trade.quantity;
    }
    
    const initialValue = trade.buyPrice * trade.quantity;
    const gainPercentage = initialValue > 0 
      ? ((currentValue - initialValue) / initialValue) * 100 
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
      gain: trade.sellPrice ? gain : (currentPrice ? (currentPrice - trade.buyPrice) * trade.quantity : 0),
      gainPercentage,
      isOpen,
    };
  }

  private sortTrades(
    trades: TradeDTO[], 
    sortBy: string, 
    sortOrder: 'asc' | 'desc' = 'desc'
  ): TradeDTO[] {
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    
    return trades.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.buyDate).getTime();
          bValue = new Date(b.buyDate).getTime();
          break;
        case 'symbol':
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        case 'gain':
          aValue = a.gain || 0;
          bValue = b.gain || 0;
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return -1 * multiplier;
      if (aValue > bValue) return 1 * multiplier;
      return 0;
    });
  }
}

// Export singleton instance
export const tradeService: TradeService = new TradeServiceImpl();
