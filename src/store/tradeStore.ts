import { create } from 'zustand';
import { tradeService, storageService } from '../services';
import type { 
  TradeDTO, 
  CreateTradeDTO, 
  UpdateTradeDTO,
  TradeFilterDTO,
  TradeListResponseDTO
} from '../dto';

interface TradeState {
  // Data
  trades: TradeDTO[];
  filteredList: TradeListResponseDTO | null;
  currentFilter: TradeFilterDTO;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initialize: () => Promise<void>;
  addTrade: (tradeData: CreateTradeDTO) => Promise<void>;
  updateTrade: (tradeId: string, updates: UpdateTradeDTO) => Promise<void>;
  deleteTrade: (tradeId: string) => Promise<void>;
  sellTrade: (tradeId: string, sellPrice: number) => Promise<void>;
  clearAllTrades: () => Promise<void>;
  filterTrades: (filter: TradeFilterDTO) => Promise<void>;
  updatePrices: (priceMap: Map<string, number>) => void;
}

export const useTradeStore = create<TradeState>((set, get) => ({
  // Initial state
  trades: [],
  filteredList: null,
  currentFilter: {},
  isLoading: true,
  error: null,
  
  // Actions
  initialize: async () => {
    try {
      const loadedTrades = storageService.loadTrades();
      const tradeDTOs = loadedTrades.map(trade => 
        storageService.getTradeById(trade.id) as TradeDTO
      );
      
      const initialList = tradeService.getTradesWithFilter(loadedTrades, {});
      
      set({
        trades: tradeDTOs,
        filteredList: initialList,
        isLoading: false,
        error: null
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load trades';
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
      console.error('Error loading trades:', err);
    }
  },
  
  addTrade: async (tradeData: CreateTradeDTO) => {
    try {
      const newTradeDTO = tradeService.createTradeFromDTO(tradeData);
      storageService.saveTradeDTO(newTradeDTO);
      
      set(state => ({
        trades: [...state.trades, newTradeDTO],
        error: null
      }));
      
      // Refresh filtered list
      await get().filterTrades(get().currentFilter);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add trade';
      set({ error: errorMessage });
      console.error('Error adding trade:', err);
    }
  },
  
  updateTrade: async (tradeId: string, updates: UpdateTradeDTO) => {
    try {
      const domainTrades = storageService.loadTrades();
      const updatedTradeDTO = tradeService.updateTrade(tradeId, updates, domainTrades);
      
      if (!updatedTradeDTO) {
        set({ error: `Trade with ID ${tradeId} not found` });
        return;
      }
      
      // Update in storage
      storageService.updateTradeDTO(updatedTradeDTO);
      
      // Update state
      set(state => ({
        trades: state.trades.map(trade => 
          trade.id === tradeId ? updatedTradeDTO : trade
        ),
        error: null
      }));
      
      // Refresh filtered list
      await get().filterTrades(get().currentFilter);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update trade';
      set({ error: errorMessage });
      console.error('Error updating trade:', err);
    }
  },
  
  deleteTrade: async (tradeId: string) => {
    try {
      const success = storageService.deleteTradeById(tradeId);
      
      if (!success) {
        set({ error: `Trade with ID ${tradeId} not found` });
        return;
      }
      
      // Update state
      set(state => ({
        trades: state.trades.filter(trade => trade.id !== tradeId),
        error: null
      }));
      
      // Refresh filtered list
      await get().filterTrades(get().currentFilter);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete trade';
      set({ error: errorMessage });
      console.error('Error deleting trade:', err);
    }
  },
  
  sellTrade: async (tradeId: string, sellPrice: number) => {
    try {
      await get().updateTrade(tradeId, {
        sellPrice, 
        sellDate: new Date().toLocaleDateString(),
        id: ''
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sell trade';
      set({ error: errorMessage });
      console.error('Error selling trade:', err);
    }
  },
  
  clearAllTrades: async () => {
    try {
      storageService.clearTrades();
      set({
        trades: [],
        filteredList: { trades: [], totalCount: 0, totalValue: 0, totalGain: 0 },
        error: null
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear trades';
      set({ error: errorMessage });
      console.error('Error clearing trades:', err);
    }
  },
  
  filterTrades: async (filter: TradeFilterDTO) => {
    try {
      const domainTrades = storageService.loadTrades();
      const filteredResults = tradeService.getTradesWithFilter(domainTrades, filter);
      
      set({
        filteredList: filteredResults,
        currentFilter: filter,
        error: null
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to filter trades';
      set({ error: errorMessage });
      console.error('Error filtering trades:', err);
    }
  },
  
  updatePrices: (priceMap: Map<string, number>) => {
    const { currentFilter } = get();
    const domainTrades = storageService.loadTrades();
    const updatedList = tradeService.getTradesWithFilter(domainTrades, currentFilter, priceMap);
    
    set({
      filteredList: updatedList
    });
  }
}));
