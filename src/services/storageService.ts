import type { Trade } from '../types';
import type { TradeDTO } from '../dto';
import type { TradeMapper } from '../mappers';

/**
 * Enhanced Storage Service interface with DTO support
 */
export interface StorageService {
  // Original methods
  saveTrades(trades: Trade[]): void;
  loadTrades(): Trade[];
  clearTrades(): void;
  
  // New DTO-based methods
  saveTradeDTO(trade: TradeDTO): void;
  updateTradeDTO(trade: TradeDTO): boolean;
  deleteTradeById(id: string): boolean;
  getTradeById(id: string): TradeDTO | null;
  saveCache<T>(key: string, data: T, expirationMinutes?: number): void;
  loadCache<T>(key: string): { data: T | null, expired: boolean };
  clearCache(key?: string): void;
}

class LocalStorageService implements StorageService {
  private readonly tradeStorageKey = 'simulated-stock-trades';
  private readonly cacheKeyPrefix = 'stock-tracker-cache-';
  
  // Original methods
  saveTrades(trades: Trade[]): void {
    try {
      const serializedTrades = JSON.stringify(trades);
      localStorage.setItem(this.tradeStorageKey, serializedTrades);
    } catch (error) {
      console.error('Failed to save trades to localStorage:', error);
    }
  }

  loadTrades(): Trade[] {
    try {
      const stored = localStorage.getItem(this.tradeStorageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load trades from localStorage:', error);
      return [];
    }
  }

  clearTrades(): void {
    try {
      localStorage.removeItem(this.tradeStorageKey);
    } catch (error) {
      console.error('Failed to clear trades from localStorage:', error);
    }
  }

  // New DTO-based methods
  saveTradeDTO(trade: TradeDTO): void {
    const trades = this.loadTrades();
    
    // Remove extra properties from DTO that aren't part of the domain model
    const { currentValue, gain, gainPercentage, isOpen, ...domainTrade } = trade;
    
    // Add the new trade to the array
    trades.push(domainTrade as Trade);
    
    // Save the updated array
    this.saveTrades(trades);
  }

  updateTradeDTO(trade: TradeDTO): boolean {
    const trades = this.loadTrades();
    const index = trades.findIndex(t => t.id === trade.id);
    
    if (index === -1) return false;
    
    // Remove extra properties from DTO that aren't part of the domain model
    const { currentValue, gain, gainPercentage, isOpen, ...domainTrade } = trade;
    
    // Update the trade
    trades[index] = domainTrade as Trade;
    
    // Save the updated array
    this.saveTrades(trades);
    return true;
  }

  deleteTradeById(id: string): boolean {
    const trades = this.loadTrades();
    const initialLength = trades.length;
    
    const filteredTrades = trades.filter(trade => trade.id !== id);
    
    if (filteredTrades.length === initialLength) {
      return false; // No trade was deleted
    }
    
    this.saveTrades(filteredTrades);
    return true;
  }

  getTradeById(id: string): TradeDTO | null {
    const trades = this.loadTrades();
    const trade = trades.find(t => t.id === id);
    
    if (!trade) return null;
    
    return TradeMapper.toDTO(trade);
  }

  saveCache<T>(key: string, data: T, expirationMinutes: number = 15): void {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        expiration: expirationMinutes * 60 * 1000 // Convert minutes to milliseconds
      };
      
      localStorage.setItem(this.cacheKeyPrefix + key, JSON.stringify(cacheItem));
    } catch (error) {
      console.error(`Failed to save cache for key ${key}:`, error);
    }
  }

  loadCache<T>(key: string): { data: T | null, expired: boolean } {
    try {
      const stored = localStorage.getItem(this.cacheKeyPrefix + key);
      
      if (!stored) {
        return { data: null, expired: true };
      }
      
      const cacheItem = JSON.parse(stored);
      const now = Date.now();
      const elapsed = now - cacheItem.timestamp;
      const expired = elapsed > cacheItem.expiration;
      
      return {
        data: cacheItem.data as T,
        expired
      };
    } catch (error) {
      console.error(`Failed to load cache for key ${key}:`, error);
      return { data: null, expired: true };
    }
  }

  clearCache(key?: string): void {
    try {
      // Clear specific cache key
      if (key) {
        localStorage.removeItem(this.cacheKeyPrefix + key);
        return;
      }
      
      // Clear all cache items
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey?.startsWith(this.cacheKeyPrefix)) {
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}

// Export singleton instance
export const storageService: StorageService = new LocalStorageService();
