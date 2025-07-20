/**
 * Trade-related type definitions
 */

// Core domain model
export interface Trade {
  id: string;
  symbol: string;
  quantity: number;
  buyPrice: number;
  buyDate: string;
  sellPrice?: number;
  sellDate?: string;
}

// Form data for creating trades
export interface TradeFormData {
  symbol: string;
  quantity: number;
  buyPrice: number;
}

// Chart data for visualizations
export interface TradeGainData {
  date: string;
  gain: number;
  symbol: string;
}

// Component prop interfaces
export interface TradeListProps {
  trades: TradeDTO[];
  onSellTrade: (tradeId: string, sellPrice: number) => void;
}

export interface TradeFormProps {
  onSubmit: (formData: TradeFormData) => void;
  disabled?: boolean;
}

export interface TradeEntryProps {
  trade: TradeDTO;
  onSell: (tradeId: string, sellPrice: number) => void;
}

export interface TradesSummaryProps {
  trades: TradeDTO[];
}

// DTOs for data transfer
export interface TradeDTO {
  id: string;
  symbol: string;
  quantity: number;
  buyPrice: number;
  buyDate: string;
  sellPrice?: number;
  sellDate?: string;
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
}

export interface TradeListResponseDTO {
  trades: TradeDTO[];
  totalCount: number;
  totalValue: number;
  totalGain: number;
}
