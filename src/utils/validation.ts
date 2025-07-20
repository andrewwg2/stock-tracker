/**
 * Validation utility functions
 */

import type { TradeFormData } from '../types';

/**
 * Validates a stock symbol format
 * @param symbol The stock symbol to validate
 * @returns True if valid, false otherwise
 */
export const isValidSymbol = (symbol: string): boolean => {
  const trimmedSymbol = symbol.trim().toUpperCase();
  
  // Basic validation: 1-5 uppercase letters
  const symbolRegex = /^[A-Z]{1,5}$/;
  return symbolRegex.test(trimmedSymbol);
};

/**
 * Validates trade form data
 * @param formData The form data to validate
 * @returns Validation result with errors
 */
export const validateTradeForm = (formData: TradeFormData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validate symbol
  if (!formData.symbol.trim()) {
    errors.push('Stock symbol is required');
  } else if (!isValidSymbol(formData.symbol)) {
    errors.push('Stock symbol must be 1-5 uppercase letters');
  }
  
  // Validate quantity
  if (!formData.quantity || formData.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  } else if (!Number.isInteger(formData.quantity)) {
    errors.push('Quantity must be a whole number');
  }
  
  // Validate buy price
  if (!formData.buyPrice || formData.buyPrice <= 0) {
    errors.push('Buy price must be greater than 0');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates a price value
 * @param price The price to validate
 * @returns True if valid, false otherwise
 */
export const isValidPrice = (price: number): boolean => {
  return typeof price === 'number' && price > 0 && isFinite(price);
};

/**
 * Validates a quantity value
 * @param quantity The quantity to validate
 * @returns True if valid, false otherwise
 */
export const isValidQuantity = (quantity: number): boolean => {
  return typeof quantity === 'number' && quantity > 0 && Number.isInteger(quantity);
};

/**
 * Sanitizes a stock symbol input
 * @param symbol The symbol to sanitize
 * @returns Sanitized symbol
 */
export const sanitizeSymbol = (symbol: string): string => {
  return symbol.trim().toUpperCase().replace(/[^A-Z]/g, '');
};

/**
 * Validates date format (MM/DD/YYYY or YYYY-MM-DD)
 * @param dateString The date string to validate
 * @returns True if valid, false otherwise
 */
export const isValidDateString = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.getTime() > 0;
};

/**
 * Validates sell price against buy price
 * @param sellPrice The sell price
 * @param buyPrice The original buy price
 * @returns Validation result with warnings
 */
export const validateSellPrice = (
  sellPrice: number,
  buyPrice: number
): { isValid: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  
  if (!isValidPrice(sellPrice)) {
    return { isValid: false, warnings: ['Invalid sell price'] };
  }
  
  // Warning for loss
  if (sellPrice < buyPrice) {
    const lossPercent = ((buyPrice - sellPrice) / buyPrice * 100).toFixed(2);
    warnings.push(`This will result in a ${lossPercent}% loss`);
  }
  
  // Warning for very large gain (potential error)
  if (sellPrice > buyPrice * 10) {
    warnings.push('Sell price is significantly higher than buy price. Please verify.');
  }
  
  return { isValid: true, warnings };
};
