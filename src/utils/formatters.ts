/**
 * Formatting utility functions
 */

/**
 * Formats a number as currency
 * @param value The number to format
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Formats a date string for display
 * @param dateString The date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Formats a percentage value
 * @param value The percentage value (as decimal)
 * @returns Formatted percentage string with sign
 */
export const formatPercentage = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

/**
 * Formats a gain value with currency and sign
 * @param gain The gain amount
 * @returns Formatted gain string with currency and sign
 */
export const formatGain = (gain: number): string => {
  const sign = gain >= 0 ? '+' : '';
  return `${sign}${formatCurrency(gain)}`;
};

/**
 * Formats a large number with appropriate suffixes (K, M, B)
 * @param value The number to format
 * @returns Formatted number with suffix
 */
export const formatLargeNumber = (value: number): string => {
  const absValue = Math.abs(value);
  
  if (absValue >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  
  if (absValue >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  
  if (absValue >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  
  return value.toString();
};

/**
 * Truncates a string to a specified length with ellipsis
 * @param text The text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - 3) + '...';
};
