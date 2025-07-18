import { useState, useEffect } from 'react';
import { tradeService, storageService } from '../services';
import type { 
  TradeDTO, 
  CreateTradeDTO, 
  UpdateTradeDTO,
  TradeFilterDTO,
  TradeListResponseDTO
} from '../dto';
import { useStockPrice } from './useStockPrice';

export interface UseTradesReturn {
  tradesList: TradeListResponseDTO | null;
  tradeDTOs: TradeDTO[];
  addTrade: (tradeData: CreateTradeDTO) => void;
  updateTrade: (tradeId: string, updates: UpdateTradeDTO) => void;
  deleteTrade: (tradeId: string) => void;
  sellTrade: (tradeId: string, sellPrice: number) => void;
  clearAllTrades: () => void;
  filterTrades: (filter: TradeFilterDTO) => void;
  refreshTradeValues: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useTrades(): UseTradesReturn {
  const [trades, setTrades] = useState<TradeDTO[]>([]);
  const [filteredList, setFilteredList] = useState<TradeListResponseDTO | null>(null);
  const [currentFilter, setCurrentFilter] = useState<TradeFilterDTO>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { fetchBatchPrices, isLoading: isPriceLoading } = useStockPrice();

  // Function to refresh current prices for all trades
  const refreshTradeValues = async () => {
    if (trades.length === 0) return;
    
    try {
      // Get unique symbols
      const symbols = [...new Set(trades.map(trade => trade.symbol))];
      
      // Fetch current prices for all symbols
      const priceMap = await fetchBatchPrices(symbols);
      
      // Update filtered list with current prices
      if (filteredList) {
        const domainTrades = storageService.loadTrades();
        const updatedList = tradeService.getTradesWithFilter(
          domainTrades, 
          currentFilter, 
          priceMap
        );
        setFilteredList(updatedList);
      }
    } catch (err) {
      console.error("Error refreshing trade values:", err);
    }
  };

  // Load trades from storage on mount
  useEffect(() => {
    try {
      const loadedTrades = storageService.loadTrades();
      const tradeDTOs = loadedTrades.map(trade => storageService.getTradeById(trade.id) as TradeDTO);
      
      setTrades(tradeDTOs);
      
      // Initialize filtered list with all trades
      const initialList = tradeService.getTradesWithFilter(loadedTrades, {});
      setFilteredList(initialList);
      
      setError(null);
      
      // Initial refresh of trade values
      refreshTradeValues();
    } catch (err) {
      setError('Failed to load trades from storage');
      console.error('Error loading trades:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter trades based on criteria
  const filterTrades = (filter: TradeFilterDTO) => {
    try {
      const domainTrades = storageService.loadTrades();
      const filteredResults = tradeService.getTradesWithFilter(domainTrades, filter);
      
      setFilteredList(filteredResults);
      setCurrentFilter(filter);
      setError(null);
    } catch (err) {
      setError('Failed to filter trades');
      console.error('Error filtering trades:', err);
    }
  };

  // Add a new trade
  const addTrade = (tradeData: CreateTradeDTO) => {
    try {
      const newTradeDTO = tradeService.createTradeFromDTO(tradeData);
      storageService.saveTradeDTO(newTradeDTO);
      
      // Update state
      setTrades(prevTrades => [...prevTrades, newTradeDTO]);
      
      // Refresh filtered list
      filterTrades(currentFilter);
      
      setError(null);
    } catch (err) {
      setError('Failed to add trade');
      console.error('Error adding trade:', err);
    }
  };

  // Update an existing trade
  const updateTrade = (tradeId: string, updates: UpdateTradeDTO) => {
    try {
      const domainTrades = storageService.loadTrades();
      const updatedTradeDTO = tradeService.updateTrade(tradeId, updates, domainTrades);
      
      if (!updatedTradeDTO) {
        setError(`Trade with ID ${tradeId} not found`);
        return;
      }
      
      // Update in storage
      storageService.updateTradeDTO(updatedTradeDTO);
      
      // Update state
      setTrades(prevTrades => 
        prevTrades.map(trade => 
          trade.id === tradeId ? updatedTradeDTO : trade
        )
      );
      
      // Refresh filtered list
      filterTrades(currentFilter);
      
      setError(null);
    } catch (err) {
      setError('Failed to update trade');
      console.error('Error updating trade:', err);
    }
  };

  // Delete a trade
  const deleteTrade = (tradeId: string) => {
    try {
      const success = storageService.deleteTradeById(tradeId);
      
      if (!success) {
        setError(`Trade with ID ${tradeId} not found`);
        return;
      }
      
      // Update state
      setTrades(prevTrades => prevTrades.filter(trade => trade.id !== tradeId));
      
      // Refresh filtered list
      filterTrades(currentFilter);
      
      setError(null);
    } catch (err) {
      setError('Failed to delete trade');
      console.error('Error deleting trade:', err);
    }
  };

  // Sell a trade
  const sellTrade = (tradeId: string, sellPrice: number) => {
    try {
      updateTrade(tradeId, { sellPrice, sellDate: new Date().toLocaleDateString() });
      setError(null);
    } catch (err) {
      setError('Failed to sell trade');
      console.error('Error selling trade:', err);
    }
  };

  // Clear all trades
  const clearAllTrades = () => {
    try {
      storageService.clearTrades();
      setTrades([]);
      setFilteredList({ trades: [], totalCount: 0, totalValue: 0, totalGain: 0 });
      setError(null);
    } catch (err) {
      setError('Failed to clear trades');
      console.error('Error clearing trades:', err);
    }
  };

  return {
    tradesList: filteredList,
    tradeDTOs: trades,
    addTrade,
    updateTrade,
    deleteTrade,
    sellTrade,
    clearAllTrades,
    filterTrades,
    refreshTradeValues,
    isLoading: isLoading || isPriceLoading,
    error
  };
}
