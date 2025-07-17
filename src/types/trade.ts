export interface Trade {
  id: string;
  symbol: string;
  quantity: number;
  buyPrice: number;
  buyDate: string;
  sellPrice?: number;
  sellDate?: string;
}

export interface TradeFormData {
  symbol: string;
  quantity: number;
  buyPrice: number;
}

export interface TradeGainData {
  date: string;
  gain: number;
  symbol: string;
}

export interface StockQuote {
  symbol: string;
  price: number;
  lastUpdated: string;
}
