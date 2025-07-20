/**
 * useDebounce Hook
 * Debounces a value to prevent excessive API calls or computations
 */

import { useState, useEffect } from 'react';

/**
 * Debounces a value by delaying its update
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Debounces a callback function
 * @param callback The function to debounce
 * @param delay The delay in milliseconds
 * @param deps Dependency array for useCallback
 * @returns The debounced function
 */
export const useDebounceCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T => {
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const debouncedCallback = ((...args: Parameters<T>) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      callback(...args);
    }, delay);

    setDebounceTimer(timer);
  }) as T;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useCallback(debouncedCallback, [delay, ...deps]);
};

/**
 * Advanced debounce hook with immediate execution option
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @param immediate Whether to execute immediately on first call
 * @returns Object with debounced value and control functions
 */
export const useAdvancedDebounce = <T>(
  value: T,
  delay: number,
  immediate: boolean = false
) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    if (immediate && debouncedValue !== value) {
      setDebouncedValue(value);
      setIsDebouncing(true);
      
      const handler = setTimeout(() => {
        setIsDebouncing(false);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    } else {
      setIsDebouncing(true);
      
      const handler = setTimeout(() => {
        setDebouncedValue(value);
        setIsDebouncing(false);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }
  }, [value, delay, immediate]);

  const cancel = () => {
    setIsDebouncing(false);
  };

  const flush = () => {
    setDebouncedValue(value);
    setIsDebouncing(false);
  };

  return {
    debouncedValue,
    isDebouncing,
    cancel,
    flush,
  };
};

// React import for useCallback
import React from 'react';
