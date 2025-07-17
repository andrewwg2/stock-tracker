import type { Trade, TradeFormData } from '../types';


export interface TradeService {
  createTrade(formData: TradeFormData): Trade;
  sellTrade(trade: Trade, sellPrice: number): Trade;
  calculateGain(trade: Trade): number;
  calculateTotalGain(trades: Trade[]): number;
  isTradeOpen(trade: Trade): boolean;
  getClosedTrades(trades: Trade[]): Trade[];
}

class TradeServiceImpl implements TradeService {
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

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Export singleton instance
export const tradeService: TradeService = new TradeServiceImpl();
