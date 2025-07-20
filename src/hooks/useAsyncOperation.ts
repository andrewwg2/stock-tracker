/**
 * useAsyncOperation Hook
 * Manages async operations with loading, error, and success states
 */

import { useState, useCallback } from 'react';

export interface AsyncOperationState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isSuccess: boolean;
  isError: boolean;
}

export interface UseAsyncOperationReturn<T> extends AsyncOperationState<T> {
  execute: (operation: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
  setError: (error: string | null) => void;
}

/**
 * Hook for managing async operations with consistent state management
 */
export const useAsyncOperation = <T = any>(
  initialData: T | null = null
): UseAsyncOperationReturn<T> => {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: initialData,
    isLoading: false,
    error: null,
    isSuccess: false,
    isError: false,
  });

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      isSuccess: false,
      isError: false,
    }));

    try {
      const result = await operation();
      
      setState(prev => ({
        ...prev,
        data: result,
        isLoading: false,
        isSuccess: true,
        isError: false,
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isSuccess: false,
        isError: true,
      }));

      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      isLoading: false,
      error: null,
      isSuccess: false,
      isError: false,
    });
  }, [initialData]);

  const setData = useCallback((data: T | null) => {
    setState(prev => ({
      ...prev,
      data,
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error,
      isError: error !== null,
    }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
  };
};

/**
 * Hook for managing multiple async operations
 */
export const useAsyncOperationMap = <T extends Record<string, any>>() => {
  const [operations, setOperations] = useState<Record<string, AsyncOperationState<any>>>({});

  const execute = useCallback(async <K extends keyof T>(
    key: K,
    operation: () => Promise<T[K]>
  ): Promise<T[K] | null> => {
    setOperations(prev => ({
      ...prev,
      [key]: {
        data: null,
        isLoading: true,
        error: null,
        isSuccess: false,
        isError: false,
      },
    }));

    try {
      const result = await operation();
      
      setOperations(prev => ({
        ...prev,
        [key]: {
          data: result,
          isLoading: false,
          error: null,
          isSuccess: true,
          isError: false,
        },
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      
      setOperations(prev => ({
        ...prev,
        [key]: {
          data: null,
          isLoading: false,
          error: errorMessage,
          isSuccess: false,
          isError: true,
        },
      }));

      return null;
    }
  }, []);

  const getOperation = useCallback(<K extends keyof T>(key: K): AsyncOperationState<T[K]> => {
    return operations[key] || {
      data: null,
      isLoading: false,
      error: null,
      isSuccess: false,
      isError: false,
    };
  }, [operations]);

  const reset = useCallback(<K extends keyof T>(key?: K) => {
    if (key) {
      setOperations(prev => {
        const { [key]: removed, ...rest } = prev;
        return rest;
      });
    } else {
      setOperations({});
    }
  }, []);

  const isAnyLoading = Object.values(operations).some(op => op.isLoading);
  const hasAnyError = Object.values(operations).some(op => op.isError);
  const allSuccessful = Object.values(operations).every(op => op.isSuccess);

  return {
    execute,
    getOperation,
    reset,
    operations,
    isAnyLoading,
    hasAnyError,
    allSuccessful,
  };
};

/**
 * Hook for async operations with automatic retry
 */
export const useAsyncOperationWithRetry = <T = any>(
  maxRetries: number = 3,
  retryDelay: number = 1000
): UseAsyncOperationReturn<T> & { retryCount: number } => {
  const [retryCount, setRetryCount] = useState(0);
  const baseOperation = useAsyncOperation<T>();

  const executeWithRetry = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
    let attempts = 0;
    
    const attemptOperation = async (): Promise<T | null> => {
      attempts++;
      setRetryCount(attempts - 1);

      try {
        const result = await baseOperation.execute(operation);
        setRetryCount(0); // Reset on success
        return result;
      } catch (error) {
        if (attempts <= maxRetries) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
          return attemptOperation();
        } else {
          setRetryCount(maxRetries);
          throw error;
        }
      }
    };

    return attemptOperation();
  }, [baseOperation, maxRetries, retryDelay]);

  const reset = useCallback(() => {
    baseOperation.reset();
    setRetryCount(0);
  }, [baseOperation]);

  return {
    ...baseOperation,
    execute: executeWithRetry,
    reset,
    retryCount,
  };
};
