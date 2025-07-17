import type { Trade } from '../types';

export interface StorageService {
  saveTrades(trades: Trade[]): void;
  loadTrades(): Trade[];
  clearTrades(): void;
}

class LocalStorageService implements StorageService {
  private readonly storageKey = 'simulated-stock-trades';

  saveTrades(trades: Trade[]): void {
    try {
      const serializedTrades = JSON.stringify(trades);
      localStorage.setItem(this.storageKey, serializedTrades);
    } catch (error) {
      console.error('Failed to save trades to localStorage:', error);
    }
  }

  loadTrades(): Trade[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load trades from localStorage:', error);
      return [];
    }
  }

  clearTrades(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear trades from localStorage:', error);
    }
  }
}

// Export singleton instance
export const storageService: StorageService = new LocalStorageService();
