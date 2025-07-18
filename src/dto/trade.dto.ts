/**
 * Data Transfer Object for a Trade
 */
export interface TradeDTO {
  id: string;
  symbol: string;
  quantity: number;
  buyPrice: number;
  buyDate: string;
  sellPrice?: number;
  sellDate?: string;
  // Additional fields for the UI
  currentValue?: number;
  gain?: number;
  gainPercentage?: number;
  isOpen?: boolean;
}

/**
 * DTO for creating a new trade
 */
export interface CreateTradeDTO {
  symbol: string;
  quantity: number;
  buyPrice: number;
}

/**
 * DTO for updating an existing trade
 */
export interface UpdateTradeDTO {
  id: string;
  sellPrice?: number;
  sellDate?: string;
  quantity?: number;
  buyPrice?: number;
}

/**
 * DTO for trade filtering options
 */
export interface TradeFilterDTO {
  symbol?: string;
  openOnly?: boolean;
  closedOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Trade list response with metadata
 */
export interface TradeListResponseDTO {
  trades: TradeDTO[];
  totalCount: number;
  totalValue: number;
  totalGain: number;
}
