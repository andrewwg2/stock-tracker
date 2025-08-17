/**
 * useDebounce Hook
 * Debounces a value to prevent excessive API calls or computations
 */
import { useState, useEffect, useRef, useCallback } from 'react';

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
  // Use useRef to store timer instead of useState to avoid re-renders
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay, ...deps]
  );

  return debouncedCallback;
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
  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousValue = useRef<T>(value);

  useEffect(() => {
    // Only start debouncing if value actually changed
    if (previousValue.current === value) {
      return;
    }
    
    previousValue.current = value;

    if (immediate) {
      setDebouncedValue(value);
      setIsDebouncing(true);
      
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsDebouncing(false);
      }, delay);
    } else {
      setIsDebouncing(true);
      
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
        setIsDebouncing(false);
      }, delay);
    }

    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [value, delay, immediate]);

  const cancel = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setIsDebouncing(false);
  }, []);

  const flush = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setDebouncedValue(value);
    setIsDebouncing(false);
  }, [value]);

  return {
    debouncedValue,
    isDebouncing,
    cancel,
    flush,
  };
};