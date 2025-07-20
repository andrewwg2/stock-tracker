/**
 * Application constants
 */

// Cache configuration
export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// API configuration
export const API_CONFIG = {
  TIMEOUT: 10000, // 10 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// UI constants
export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
  MAX_TRADES_PER_PAGE: 50,
  MIN_SYMBOL_LENGTH: 1,
  MAX_SYMBOL_LENGTH: 5,
} as const;

// Color schemes for charts and UI
export const COLORS = {
  POSITIVE: '#16a34a', // green-600
  NEGATIVE: '#dc2626', // red-600
  NEUTRAL: '#6b7280', // gray-500
  PRIMARY: '#2563eb', // blue-600
  SECONDARY: '#64748b', // slate-500
} as const;

// Chart configuration
export const CHART_CONFIG = {
  HEIGHT: 300,
  MARGIN: { top: 20, right: 30, left: 20, bottom: 5 },
  ANIMATION_DURATION: 300,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  TRADES: 'stock-tracker-trades',
  CACHE_PREFIX: 'stock-tracker-cache-',
  USER_PREFERENCES: 'stock-tracker-preferences',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  INVALID_SYMBOL: 'Invalid stock symbol. Please enter a valid symbol (1-5 letters).',
  PRICE_FETCH_ERROR: 'Failed to fetch current price. Please try again.',
  GENERAL_ERROR: 'An unexpected error occurred. Please refresh and try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  TRADE_ADDED: 'Trade added successfully!',
  TRADE_SOLD: 'Trade sold successfully!',
  TRADES_CLEARED: 'All trades cleared successfully!',
  PRICES_REFRESHED: 'Prices refreshed successfully!',
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  ENABLE_ANALYTICS: true,
  ENABLE_REAL_TIME_PRICES: true,
  ENABLE_EXPORT: true,
  ENABLE_DARK_MODE: false,
} as const;

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM d, yyyy',
  CHART: 'MM/dd',
  ISO: 'yyyy-MM-dd',
} as const;

// Chart color palette for multiple series
export const CHART_COLORS = [
  '#2563eb', // blue-600
  '#16a34a', // green-600
  '#dc2626', // red-600
  '#ca8a04', // yellow-600
  '#9333ea', // purple-600
  '#c2410c', // orange-600
  '#0891b2', // cyan-600
  '#be123c', // rose-600
] as const;

// Responsive breakpoints (matching Tailwind CSS)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;
