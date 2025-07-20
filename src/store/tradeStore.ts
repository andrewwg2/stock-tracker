/**
 * Trade Store
 * Zustand store for managing trade state and operations
 */

import { create } from 'zustand';
import { tradeService, storageService } from '../services';
import { TradeMapper } from '../mappers';
import type { 
  TradeDTO, 
  CreateTradeDTO, 
  UpdateTradeDTO,
  TradeFilterDTO,
  TradeListResponseDTO
} from '../dto';

interface TradeStoreState {
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
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useTradeStore = create<TradeStoreState>((set, get) => ({
  // Initial state
  trades: [],
  filteredList: null,
  currentFilter: {},
  isLoading: true,
  error: null,
  
  // Actions
  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Load trades from storage
      const loadedTrades = storageService.loadTrades();
      
      // Convert to DTOs
      const tradeDTOs = TradeMapper.toDTOs(loadedTrades);
      
      // Create initial filtered list
      const initialList = tradeService.getTradesWithFilter(loadedTrades, {});
      
      set({
        trades: tradeDTOs,
        filteredList: initialList,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load trades';
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
      console.error('Error initializing trade store:', error);
    }
  },
  
  addTrade: async (tradeData: CreateTradeDTO) => {
    try {
      set({ error: null });
      
      // Validate input
      const validation = TradeMapper.validateCreateDTO(tradeData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      // Sanitize input
      const sanitizedData = TradeMapper.sanitizeCreateDTO(tradeData);
      
      // Create trade
      const newTradeDTO = tradeService.createTradeFromDTO(sanitizedData);
      
      // Save to storage
      storageService.saveTradeDTO(newTradeDTO);
      
      // Update state
      const currentTrades = get().trades;
      const updatedTrades = [...currentTrades, newTradeDTO];
      
      set({ trades: updatedTrades });
      
      // Refresh filtered list
      await get().filterTrades(get().currentFilter);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add trade';
      set({ error: errorMessage });
      console.error('Error adding trade:', error);
      throw error;
    }
  },
  
  updateTrade: async (tradeId: string, updates: UpdateTradeDTO) => {
    try {
      set({ error: null });
      
      // Load current trades from storage (source of truth)
      const domainTrades = storageService.loadTrades();
      
      // Update trade
      const updatedTradeDTO = tradeService.updateTrade(tradeId, updates, domainTrades);
      
      if (!updatedTradeDTO) {
        throw new Error(`Trade with ID ${tradeId} not found`);
      }
      
      // Update in storage
      const success = storageService.updateTradeDTO(updatedTradeDTO);
      if (!success) {
        throw new Error(`Failed to update trade in storage`);
      }
      
      // Update state
      const currentTrades = get().trades;
      const updatedTrades = currentTrades.map(trade => 
        trade.id === tradeId ? updatedTradeDTO : trade
      );
      
      set({ trades: updatedTrades });
      
      // Refresh filtered list
      await get().filterTrades(get().currentFilter);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update trade';
      set({ error: errorMessage });
      console.error('Error updating trade:', error);
      throw error;
    }
  },
  
  deleteTrade: async (tradeId: string) => {
    try {
      set({ error: null });
      
      // Delete from storage
      const success = storageService.deleteTradeById(tradeId);
      
      if (!success) {
        throw new Error(`Trade with ID ${tradeId} not found`);
      }
      
      // Update state
      const currentTrades = get().trades;
      const updatedTrades = currentTrades.filter(trade => trade.id !== tradeId);
      
      set({ trades: updatedTrades });
      
      // Refresh filtered list
      await get().filterTrades(get().currentFilter);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete trade';
      set({ error: errorMessage });
      console.error('Error deleting trade:', error);
      throw error;
    }
  },
  
  sellTrade: async (tradeId: string, sellPrice: number) => {
    try {
      set({ error: null });
      
      if (sellPrice <= 0) {
        throw new Error('Sell price must be greater than 0');
      }
      
      const updates: UpdateTradeDTO = {
        id: tradeId,
        sellPrice,
        sellDate: new Date().toLocaleDateString(),
      };
      
      await get().updateTrade(tradeId, updates);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sell trade';
      set({ error: errorMessage });
      console.error('Error selling trade:', error);
      throw error;
    }
  },
  
  clearAllTrades: async () => {
    try {
      set({ error: null });
      
      // Clear storage
      storageService.clearTrades();
      
      // Reset state
      set({
        trades: [],
        filteredList: { 
          trades: [], 
          totalCount: 0, 
          totalValue: 0, 
          totalGain: 0,
          openPositions: 0,
          closedPositions: 0
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear trades';
      set({ error: errorMessage });
      console.error('Error clearing trades:', error);
      throw error;
    }
  },
  
  filterTrades: async (filter: TradeFilterDTO) => {
    try {
      set({ error: null });
      
      // Load fresh data from storage
      const domainTrades = storageService.loadTrades();
      
      // Apply filter
      const filteredResults = tradeService.getTradesWithFilter(domainTrades, filter);
      
      set({
        filteredList: filteredResults,
        currentFilter: filter,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to filter trades';
      set({ error: errorMessage });
      console.error('Error filtering trades:', error);
      throw error;
    }
  },
  
  updatePrices: (priceMap: Map<string, number>) => {
    try {
      const { currentFilter } = get();
      
      // Load fresh domain trades
      const domainTrades = storageService.loadTrades();
      
      // Get updated list with current prices
      const updatedList = tradeService.getTradesWithFilter(
        domainTrades, 
        currentFilter, 
        priceMap
      );
      
      // Also update the main trades array with current prices
      const updatedTrades = TradeMapper.toDTOs(domainTrades, priceMap);
      
      set({
        trades: updatedTrades,
        filteredList: updatedList,
      });
    } catch (error) {
      console.error('Error updating prices:', error);
      set({ error: 'Failed to update prices' });
    }
  },
  
  setError: (error: string | null) => {
    set({ error });
  },
  
  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },
}));

// Export helper selectors
export const useTradeSelectors = () => {
  const store = useTradeStore();
  
  return {
    // Basic selectors
    hasData: store.trades.length > 0,
    isEmpty: store.trades.length === 0,
    isError: !!store.error,
    
    // Computed values
    totalTrades: store.trades.length,
    openTrades: store.trades.filter(trade => trade.isOpen).length,
    closedTrades: store.trades.filter(trade => !trade.isOpen).length,
    
    // Filter status
    isFiltered: Object.keys(store.currentFilter).length > 0,
    filterCount: store.filteredList?.totalCount || 0,
    
    // Financial metrics
    totalValue: store.filteredList?.totalValue || 0,
    totalGain: store.filteredList?.totalGain || 0,
    
    // Symbols
    uniqueSymbols: [...new Set(store.trades.map(trade => trade.symbol))],
  };
};
