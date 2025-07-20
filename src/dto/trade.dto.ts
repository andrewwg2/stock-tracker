/**
 * Trade-related Data Transfer Objects
 */

export interface TradeDTO {
  id: string;
  symbol: string;
  quantity: number;
  buyPrice: number;
  buyDate: string;
  sellPrice?: number;
  sellDate?: string;
  // Computed fields for UI
  currentValue?: number;
  gain?: number;
  gainPercentage?: number;
  isOpen?: boolean;
}

export interface CreateTradeDTO {
  symbol: string;
  quantity: number;
  buyPrice: number;
}

export interface UpdateTradeDTO {
  id: string;
  sellPrice?: number;
  sellDate?: string;
  quantity?: number;
  buyPrice?: number;
}

export interface TradeFilterDTO {
  symbol?: string;
  openOnly?: boolean;
  closedOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
  minGain?: number;
  maxGain?: number;
  sortBy?: 'date' | 'symbol' | 'gain' | 'quantity';
  sortOrder?: 'asc' | 'desc';
}

export interface TradeListResponseDTO {
  trades: TradeDTO[];
  totalCount: number;
  totalValue: number;
  totalGain: number;
  unrealizedGain?: number;
  realizedGain?: number;
  openPositions: number;
  closedPositions: number;
}

export interface TradeStatsDTO {
  totalInvestment: number;
  totalValue: number;
  totalGain: number;
  totalGainPercentage: number;
  bestTrade?: TradeDTO;
  worstTrade?: TradeDTO;
  averageGainPerTrade: number;
  winRate: number; // percentage of profitable trades
}

export interface TradeSummaryDTO {
  trades: TradeDTO[];
  stats: TradeStatsDTO;
  chartData: Array<{
    date: string;
    value: number;
    gain: number;
  }>;
}

export interface ExportTradeDTO {
  symbol: string;
  quantity: number;
  buyPrice: number;
  buyDate: string;
  sellPrice?: number;
  sellDate?: string;
  gain?: number;
  gainPercentage?: number;
}
