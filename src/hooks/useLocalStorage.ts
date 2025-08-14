/**
 * useLocalStorage.ts
 * Provides React hooks for localStorage state management with SSR support
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

type SetValue<T> = T | ((val: T) => T);

// No-op storage for SSR / unavailable localStorage
const noopStorage = {
  getItem: (_key: string): string | null => null,
  setItem: (_key: string, _value: string): void => {},
  removeItem: (_key: string): void => {},
};

// Dynamic SSR check (do NOT capture at module load)
const isSSR = () => typeof window === 'undefined';

// Safe storage accessor
const getStorage = () => {
  if (isSSR()) return noopStorage;
  try {
    const testKey = '__localStorage_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch {
    return noopStorage;
  }
};

/* ------------------------------------------------------------------ */
/* useLocalStorage                                                     */
/* ------------------------------------------------------------------ */
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, () => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (isSSR()) return initialValue;
    try {
      const item = getStorage().getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error parsing localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    try {
      const item = getStorage().getItem(key);
      if (item !== null) setStoredValue(JSON.parse(item));
    } catch (error) {
      console.error(`Error rehydrating localStorage key "${key}":`, error);
    }
    return () => {
      isMounted.current = false;
    };
  }, [key]);

  const keyRef = useRef(key);
  const initialValueRef = useRef(initialValue);
  useEffect(() => {
    keyRef.current = key;
    initialValueRef.current = initialValue;
  }, [key, initialValue]);

  useEffect(() => {
    if (!isMounted.current) return;
    try {
      const item = getStorage().getItem(key);
      setStoredValue(item ? JSON.parse(item) : initialValue);
    } catch (error) {
      console.error(`Error rehydrating localStorage key "${key}":`, error);
      setStoredValue(initialValue);
    }
  }, [key, initialValue]);

  const setValue = useCallback((value: SetValue<T>) => {
    setStoredValue((prevValue: T) => {
      try {
        const valueToStore = value instanceof Function ? value(prevValue) : value;
        if (isMounted.current) {
          getStorage().setItem(keyRef.current, JSON.stringify(valueToStore));
          if (!isSSR()) {
            window.dispatchEvent(
              new CustomEvent('localstorage', {
                detail: { key: keyRef.current, newValue: JSON.stringify(valueToStore) },
              })
            );
          }
        }
        return valueToStore;
      } catch (error) {
        console.error(`Error setting localStorage key "${keyRef.current}":`, error);
        return prevValue; // pessimistic: keep previous if persist fails
      }
    });
  }, []);

  const removeValue = useCallback(() => {
    try {
      if (isMounted.current) {
        getStorage().removeItem(keyRef.current);
        if (!isSSR()) {
          window.dispatchEvent(
            new CustomEvent('localstorage', {
              detail: { key: keyRef.current, newValue: null },
            })
          );
        }
      }
      setStoredValue(initialValueRef.current);
    } catch (error) {
      console.error(`Error removing localStorage key "${keyRef.current}":`, error);
    }
  }, []);

  useEffect(() => {
    if (isSSR()) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== key) return;
      if (e.newValue === null) setStoredValue(initialValue);
      else {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage change for key "${key}":`, error);
        }
      }
    };

    const handleCustomStorageChange = ((e: CustomEvent) => {
      if (e.detail.key !== key) return;
      if (e.detail.newValue === null) setStoredValue(initialValue);
      else {
        try {
          setStoredValue(JSON.parse(e.detail.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage change for key "${key}":`, error);
        }
      }
    }) as EventListener;

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localstorage', handleCustomStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localstorage', handleCustomStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};

/* ------------------------------------------------------------------ */
/* useLocalStorageWithExpiry                                          */
/* ------------------------------------------------------------------ */
export const useLocalStorageWithExpiry = <T>(
  key: string,
  initialValue: T,
  expirationMs: number = 24 * 60 * 60 * 1000 // 24 hours
): [T, (value: SetValue<T>) => void, () => void, boolean] => {
  // 1) Pure read (no delete). If expired → report isExpired: true.
  const getStoredValue = useCallback(() => {
    if (isSSR()) return { value: initialValue, isExpired: false };
    try {
      const item = getStorage().getItem(key);
      if (!item) return { value: initialValue, isExpired: false };

      const parsed = JSON.parse(item);
      const now = Date.now();

      if (parsed.expiry && now > parsed.expiry) {
        return { value: initialValue, isExpired: true }; // signal only
      }
      return { value: parsed.value ?? initialValue, isExpired: false };
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return { value: initialValue, isExpired: false };
    }
  }, [key, initialValue]);

  // 2) Read & clean (used after mount / on events)
  const readAndCleanIfExpired = useCallback(() => {
    if (isSSR()) return { value: initialValue, isExpired: false };
    try {
      const storage = getStorage();
      const item = storage.getItem(key);
      if (!item) return { value: initialValue, isExpired: false };

      const parsed = JSON.parse(item);
      const now = Date.now();

      if (parsed.expiry && now > parsed.expiry) {
        storage.removeItem(key); // clean on mount/rehydrate
        return { value: initialValue, isExpired: false };
      }
      return { value: parsed.value ?? initialValue, isExpired: false };
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return { value: initialValue, isExpired: false };
    }
  }, [key, initialValue]);

  const [state, setState] = useState<{ value: T; isExpired: boolean }>(getStoredValue);

  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;
    setState(readAndCleanIfExpired()); // after mount → cleaned & not expired
    return () => {
      isMounted.current = false;
    };
  }, [readAndCleanIfExpired]);

  const keyRef = useRef(key);
  const initialValueRef = useRef(initialValue);
  const expirationMsRef = useRef(expirationMs);
  useEffect(() => {
    keyRef.current = key;
    initialValueRef.current = initialValue;
    expirationMsRef.current = expirationMs;
  }, [key, initialValue, expirationMs]);

  useEffect(() => {
    if (!isMounted.current) return;
    setState(readAndCleanIfExpired());
  }, [key, readAndCleanIfExpired]);

  const setValueWithExpiry = useCallback((value: SetValue<T>) => {
    setState((prevState: { value: T; isExpired?: boolean }) => {
      try {
        const next = value instanceof Function ? value(prevState.value) : value;
        const item = { value: next, expiry: Date.now() + expirationMsRef.current };

        if (isMounted.current) {
          getStorage().setItem(keyRef.current, JSON.stringify(item));
          if (!isSSR()) {
            window.dispatchEvent(
              new CustomEvent('localstorage', {
                detail: { key: keyRef.current, newValue: JSON.stringify(item) },
              })
            );
          }
        }

        return { value: next, isExpired: false };
      } catch (error) {
        console.error(`Error setting localStorage key "${keyRef.current}":`, error);
        return prevState as any;
      }
    });
  }, []);

  const removeValue = useCallback(() => {
    try {
      if (isMounted.current) {
        getStorage().removeItem(keyRef.current);
        if (!isSSR()) {
          window.dispatchEvent(
            new CustomEvent('localstorage', {
              detail: { key: keyRef.current, newValue: null },
            })
          );
        }
      }
      setState({ value: initialValueRef.current, isExpired: false });
    } catch (error) {
      console.error(`Error removing localStorage key "${keyRef.current}":`, error);
    }
  }, []);

  // Periodic expiration check (for values that expire later)
  useEffect(() => {
    if (!isMounted.current) return;

    const checkExpiration = () => {
      try {
        const item = getStorage().getItem(key);
        if (!item) return;

        const parsed = JSON.parse(item);
        const now = Date.now();

        if (parsed.expiry && now > parsed.expiry) {
          getStorage().removeItem(key);
          setState({ value: initialValue, isExpired: true });
        }
      } catch (error) {
        console.error(`Error checking expiration for key "${key}":`, error);
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 60000);
    return () => clearInterval(interval);
  }, [key, initialValue]);

  // React to storage changes
  useEffect(() => {
    if (isSSR()) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) setState(readAndCleanIfExpired());
    };

    const handleCustomStorageChange = ((e: CustomEvent) => {
      if (e.detail.key === key) setState(readAndCleanIfExpired());
    }) as EventListener;

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localstorage', handleCustomStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localstorage', handleCustomStorageChange);
    };
  }, [key, readAndCleanIfExpired]);

  return [state.value, setValueWithExpiry, removeValue, state.isExpired];
};

/* ------------------------------------------------------------------ */
/* useLocalStorageCache                                                */
/* ------------------------------------------------------------------ */
export const useLocalStorageCache = <T>(
  keyPrefix: string,
  maxItems: number = 100
) => {
  const keyPrefixRef = useRef(keyPrefix);
  const maxItemsRef = useRef(maxItems);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    keyPrefixRef.current = keyPrefix;
    maxItemsRef.current = maxItems;
  }, [keyPrefix, maxItems]);

  const getCacheKey = useCallback((key: string) => `${keyPrefixRef.current}_${key}`, []);

  const setItem = useCallback(
    (key: string, value: T, expirationMs?: number) => {
      if (!isMounted.current) return;
      try {
        const cacheKey = getCacheKey(key);
        const now = Date.now();
        const item = {
          value,
          timestamp: now,
          expiry: expirationMs ? now + expirationMs : undefined,
        };

        getStorage().setItem(cacheKey, JSON.stringify(item));

        if (!isSSR()) {
          const storage = getStorage();
          const allKeys = Object.keys(localStorage).filter((k) =>
            k.startsWith(keyPrefixRef.current)
          );
          if (allKeys.length > maxItemsRef.current) {
            const itemsWithTimestamp = allKeys.map((k) => {
              try {
                const stored = storage.getItem(k);
                const parsed = stored ? JSON.parse(stored) : null;
                return { key: k, timestamp: parsed?.timestamp || 0 };
              } catch {
                return { key: k, timestamp: 0 };
              }
            });

            itemsWithTimestamp
              .sort((a, b) => a.timestamp - b.timestamp)
              .slice(0, allKeys.length - maxItemsRef.current)
              .forEach((item) => storage.removeItem(item.key));
          }
        }
      } catch (error) {
        console.error(`Error setting cache item "${key}":`, error);
      }
    },
    [getCacheKey]
  );

  const getItem = useCallback(
    (key: string): T | null => {
      if (isSSR()) return null;
      try {
        const cacheKey = getCacheKey(key);
        const stored = getStorage().getItem(cacheKey);
        if (!stored) return null;

        const parsed = JSON.parse(stored);
        const now = Date.now();
        if (parsed.expiry && now > parsed.expiry) {
          getStorage().removeItem(cacheKey);
          return null;
        }
        return parsed.value;
      } catch (error) {
        console.error(`Error getting cache item "${key}":`, error);
        return null;
      }
    },
    [getCacheKey]
  );

  const removeItem = useCallback(
    (key: string) => {
      if (!isMounted.current) return;
      try {
        const cacheKey = getCacheKey(key);
        getStorage().removeItem(cacheKey);
      } catch (error) {
        console.error(`Error removing cache item "${key}":`, error);
      }
    },
    [getCacheKey]
  );

  const clearAll = useCallback(() => {
    if (!isMounted.current) return;
    try {
      if (!isSSR()) {
        const storage = getStorage();
        const keysToRemove = Object.keys(localStorage).filter((k) =>
          k.startsWith(keyPrefixRef.current)
        );
        keysToRemove.forEach((key) => storage.removeItem(key));
      }
    } catch (error) {
      console.error(`Error clearing cache with prefix "${keyPrefixRef.current}":`, error);
    }
  }, []);

  return useMemo(
    () => ({ setItem, getItem, removeItem, clearAll }),
    [setItem, getItem, removeItem, clearAll]
  );
};

// Type declaration for the custom event
declare global {
  interface WindowEventMap {
    'localstorage': CustomEvent<{ key: string; newValue: string | null }>;
  }
}
