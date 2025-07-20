/**
 * Card Component
 * Reusable card container with consistent styling
 */

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = React.memo(({
  variant = 'default',
  padding = 'md',
  hoverable = false,
  className = '',
  children,
  ...props
}) => {
  const baseClasses = 'bg-white rounded-lg';
  
  const variantClasses = {
    default: 'shadow-sm border border-gray-200',
    elevated: 'shadow-lg',
    outlined: 'border-2 border-gray-200'
  };
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  const hoverClasses = hoverable ? 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5' : '';
  
  const allClasses = [
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    hoverClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={allClasses} {...props}>
      {children}
    </div>
  );
});

Card.displayName = 'Card';
