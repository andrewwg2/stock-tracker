/**
 * useLocalStorage Hook
 * Provides a React hook for localStorage state management
 */

import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((val: T) => T);

export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, () => void] => {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value: SetValue<T>) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Function to remove the value from localStorage
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes to this localStorage key from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage change for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue, removeValue];
};

/**
 * Hook for managing localStorage with expiration
 */
export const useLocalStorageWithExpiry = <T>(
  key: string,
  initialValue: T,
  expirationMs: number = 24 * 60 * 60 * 1000 // 24 hours default
): [T, (value: SetValue<T>) => void, () => void, boolean] => {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) {
        return initialValue;
      }

      const parsed = JSON.parse(item);
      const now = Date.now();

      // Check if expired
      if (parsed.expiry && now > parsed.expiry) {
        window.localStorage.removeItem(key);
        return initialValue;
      }

      return parsed.value || initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const [isExpired, setIsExpired] = useState(false);

  const setValueWithExpiry = useCallback((value: SetValue<T>) => {
    try {
      const valueToStore = value instanceof Function ? value(value) : value;
      const now = Date.now();
      const expiry = now + expirationMs;

      const item = {
        value: valueToStore,
        expiry,
      };

      setValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(item));
      setIsExpired(false);
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, expirationMs]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setValue(initialValue);
      setIsExpired(false);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Check for expiration periodically
  useEffect(() => {
    const checkExpiration = () => {
      try {
        const item = window.localStorage.getItem(key);
        if (!item) {
          return;
        }

        const parsed = JSON.parse(item);
        const now = Date.now();

        if (parsed.expiry && now > parsed.expiry) {
          window.localStorage.removeItem(key);
          setValue(initialValue);
          setIsExpired(true);
        }
      } catch (error) {
        console.error(`Error checking expiration for key "${key}":`, error);
      }
    };

    // Check immediately
    checkExpiration();

    // Check every minute
    const interval = setInterval(checkExpiration, 60000);

    return () => clearInterval(interval);
  }, [key, initialValue]);

  return [value, setValueWithExpiry, removeValue, isExpired];
};

/**
 * Hook for managing localStorage as a cache with size limits
 */
export const useLocalStorageCache = <T>(
  keyPrefix: string,
  maxItems: number = 100
) => {
  const getCacheKey = useCallback((key: string) => `${keyPrefix}_${key}`, [keyPrefix]);

  const setItem = useCallback((key: string, value: T, expirationMs?: number) => {
    try {
      const cacheKey = getCacheKey(key);
      const now = Date.now();
      
      const item = {
        value,
        timestamp: now,
        expiry: expirationMs ? now + expirationMs : undefined,
      };

      localStorage.setItem(cacheKey, JSON.stringify(item));

      // Clean up old items if we exceed the limit
      const allKeys = Object.keys(localStorage).filter(k => k.startsWith(keyPrefix));
      if (allKeys.length > maxItems) {
        // Remove oldest items
        const itemsWithTimestamp = allKeys.map(k => {
          try {
            const stored = localStorage.getItem(k);
            const parsed = stored ? JSON.parse(stored) : null;
            return { key: k, timestamp: parsed?.timestamp || 0 };
          } catch {
            return { key: k, timestamp: 0 };
          }
        });

        itemsWithTimestamp
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(0, allKeys.length - maxItems)
          .forEach(item => localStorage.removeItem(item.key));
      }
    } catch (error) {
      console.error(`Error setting cache item "${key}":`, error);
    }
  }, [keyPrefix, getCacheKey, maxItems]);

  const getItem = useCallback((key: string): T | null => {
    try {
      const cacheKey = getCacheKey(key);
      const stored = localStorage.getItem(cacheKey);
      
      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored);
      const now = Date.now();

      // Check if expired
      if (parsed.expiry && now > parsed.expiry) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return parsed.value;
    } catch (error) {
      console.error(`Error getting cache item "${key}":`, error);
      return null;
    }
  }, [getCacheKey]);

  const removeItem = useCallback((key: string) => {
    try {
      const cacheKey = getCacheKey(key);
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error(`Error removing cache item "${key}":`, error);
    }
  }, [getCacheKey]);

  const clearAll = useCallback(() => {
    try {
      const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith(keyPrefix));
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error(`Error clearing cache with prefix "${keyPrefix}":`, error);
    }
  }, [keyPrefix]);

  return {
    setItem,
    getItem,
    removeItem,
    clearAll,
  };
};
