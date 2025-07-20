/**
 * Storage Service
 * Handles localStorage operations for trades and cache management
 */

import type { Trade, CacheEntry } from '../types';
import type { TradeDTO } from '../dto';
import { STORAGE_KEYS, CACHE_DURATION } from '../utils';

export interface StorageService {
  // Trade operations
  saveTrades(trades: Trade[]): void;
  loadTrades(): Trade[];
  clearTrades(): void;
  saveTradeDTO(trade: TradeDTO): void;
  updateTradeDTO(trade: TradeDTO): boolean;
  deleteTradeById(id: string): boolean;
  getTradeById(id: string): TradeDTO | null;
  
  // Cache operations
  saveCache<T>(key: string, data: T, expirationMs?: number): void;
  loadCache<T>(key: string): CacheEntry<T>;
  clearCache(key?: string): void;
  clearAllCache(): void;
  
  // User preferences
  savePreferences(preferences: Record<string, unknown>): void;
  loadPreferences(): Record<string, unknown>;
  
  // Utilities
  getStorageInfo(): { used: number; available: number };
  exportData(): string;
  importData(data: string): boolean;
}

class LocalStorageService implements StorageService {
  private readonly maxCacheAge = CACHE_DURATION;

  // Trade operations
  saveTrades(trades: Trade[]): void {
    try {
      const serializedTrades = JSON.stringify(trades);
      localStorage.setItem(STORAGE_KEYS.TRADES, serializedTrades);
    } catch (error) {
      console.error('Failed to save trades:', error);
      this.handleStorageError(error);
    }
  }

  loadTrades(): Trade[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TRADES);
      if (!stored) {
        return [];
      }
      
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to load trades:', error);
      return [];
    }
  }

  clearTrades(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.TRADES);
    } catch (error) {
      console.error('Failed to clear trades:', error);
    }
  }

  saveTradeDTO(trade: TradeDTO): void {
    const trades = this.loadTrades();
    
    // Convert DTO to domain model (remove computed fields)
    const domainTrade: Trade = {
      id: trade.id,
      symbol: trade.symbol,
      quantity: trade.quantity,
      buyPrice: trade.buyPrice,
      buyDate: trade.buyDate,
      sellPrice: trade.sellPrice,
      sellDate: trade.sellDate,
    };
    
    trades.push(domainTrade);
    this.saveTrades(trades);
  }

  updateTradeDTO(trade: TradeDTO): boolean {
    const trades = this.loadTrades();
    const index = trades.findIndex(t => t.id === trade.id);
    
    if (index === -1) {
      return false;
    }
    
    // Convert DTO to domain model (remove computed fields)
    const domainTrade: Trade = {
      id: trade.id,
      symbol: trade.symbol,
      quantity: trade.quantity,
      buyPrice: trade.buyPrice,
      buyDate: trade.buyDate,
      sellPrice: trade.sellPrice,
      sellDate: trade.sellDate,
    };
    
    trades[index] = domainTrade;
    this.saveTrades(trades);
    return true;
  }

  deleteTradeById(id: string): boolean {
    const trades = this.loadTrades();
    const initialLength = trades.length;
    
    const filteredTrades = trades.filter(trade => trade.id !== id);
    
    if (filteredTrades.length === initialLength) {
      return false;
    }
    
    this.saveTrades(filteredTrades);
    return true;
  }

  getTradeById(id: string): TradeDTO | null {
    const trades = this.loadTrades();
    const trade = trades.find(t => t.id === id);
    
    if (!trade) {
      return null;
    }
    
    // Convert to DTO
    return this.tradeToDTO(trade);
  }

  // Cache operations
  saveCache<T>(key: string, data: T, expirationMs: number = this.maxCacheAge): void {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        expirationMs,
      };
      
      const cacheKey = `${STORAGE_KEYS.CACHE_PREFIX}${key}`;
      localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
    } catch (error) {
      console.error(`Failed to save cache for key ${key}:`, error);
      this.handleStorageError(error);
    }
  }

  loadCache<T>(key: string): CacheEntry<T> {
    try {
      const cacheKey = `${STORAGE_KEYS.CACHE_PREFIX}${key}`;
      const stored = localStorage.getItem(cacheKey);
      
      if (!stored) {
        return { data: null, timestamp: 0, expired: true };
      }
      
      const cacheItem = JSON.parse(stored);
      const now = Date.now();
      const elapsed = now - cacheItem.timestamp;
      const expired = elapsed > (cacheItem.expirationMs || this.maxCacheAge);
      
      return {
        data: expired ? null : cacheItem.data as T,
        timestamp: cacheItem.timestamp,
        expired,
      };
    } catch (error) {
      console.error(`Failed to load cache for key ${key}:`, error);
      return { data: null, timestamp: 0, expired: true };
    }
  }

  clearCache(key?: string): void {
    try {
      if (key) {
        const cacheKey = `${STORAGE_KEYS.CACHE_PREFIX}${key}`;
        localStorage.removeItem(cacheKey);
        return;
      }
      
      this.clearAllCache();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  clearAllCache(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_KEYS.CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear all cache:', error);
    }
  }

  // User preferences
  savePreferences(preferences: Record<string, any>): void {
    try {
      const serialized = JSON.stringify(preferences);
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, serialized);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  loadPreferences(): Record<string, any> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return {};
    }
  }

  // Utilities
  getStorageInfo(): { used: number; available: number } {
    try {
      // Estimate used storage
      let used = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          used += key.length + (value?.length || 0);
        }
      }
      
      // Most browsers have 5-10MB limit for localStorage
      const available = 1024 * 1024 * 5; // 5MB estimate
      
      return { used, available };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { used: 0, available: 0 };
    }
  }

  exportData(): string {
    try {
      const trades = this.loadTrades();
      const preferences = this.loadPreferences();
      
      const exportData = {
        trades,
        preferences,
        exportDate: new Date().toISOString(),
        version: '1.0',
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('Failed to export data');
    }
  }

  importData(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      
      // Validate data structure
      if (!parsed.trades || !Array.isArray(parsed.trades)) {
        throw new Error('Invalid data format');
      }
      
      // Import trades
      this.saveTrades(parsed.trades);
      
      // Import preferences if available
      if (parsed.preferences) {
        this.savePreferences(parsed.preferences);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  // Private helpers
  private tradeToDTO(trade: Trade): TradeDTO {
    return {
      id: trade.id,
      symbol: trade.symbol,
      quantity: trade.quantity,
      buyPrice: trade.buyPrice,
      buyDate: trade.buyDate,
      sellPrice: trade.sellPrice,
      sellDate: trade.sellDate,
      isOpen: !trade.sellPrice,
    };
  }

  private handleStorageError(error: any): void {
    if (error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded. Clearing cache...');
      this.clearAllCache();
    }
  }
}

// Export singleton instance
export const storageService: StorageService = new LocalStorageService();
