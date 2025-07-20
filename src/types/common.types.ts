/**
 * Common type definitions used throughout the application
 */

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

export interface CacheEntry<T> {
  data: T | null;
  timestamp: number;
  expired: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}
