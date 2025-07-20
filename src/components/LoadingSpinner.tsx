/**
 * LoadingSpinner Component
 * Animated loading spinner with consistent styling
 */

import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'small' | 'medium' | 'large';
  className?: string;
  color?: 'primary' | 'secondary' | 'white';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = React.memo(({
  size = 'md',
  className = '',
  color = 'primary'
}) => {
  // Handle legacy size names
  const normalizedSize = size === 'small' ? 'sm' : 
                        size === 'medium' ? 'md' : 
                        size === 'large' ? 'lg' : size;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'border-gray-300 border-t-blue-600',
    secondary: 'border-gray-200 border-t-gray-600',
    white: 'border-gray-400 border-t-white'
  };

  const spinnerClasses = [
    sizeClasses[normalizedSize],
    colorClasses[color],
    'border-2 rounded-full animate-spin'
  ].join(' ');

  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-label="Loading">
      <div className={spinnerClasses}></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';
