/**
 * Button Component
 * Reusable button component with consistent styling and behavior
 */

import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = React.memo(({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses = 'btn';
  const variantClasses = `btn-${variant}`;
  const sizeClasses = size !== 'md' ? `btn-${size}` : '';
  const widthClasses = fullWidth ? 'w-full' : '';
  const loadingClasses = loading ? 'pointer-events-none' : '';
  
  const allClasses = [
    baseClasses,
    variantClasses,
    sizeClasses,
    widthClasses,
    loadingClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={allClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" />}
      {!loading && icon && icon}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
