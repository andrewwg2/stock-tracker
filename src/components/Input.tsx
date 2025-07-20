/**
 * Input Component
 * Reusable input component with consistent styling and validation
 */

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = React.memo(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2)}`;
  const hasError = !!error;
  
  const inputClasses = [
    'form-input',
    hasError ? 'error' : '',
    leftIcon ? 'pl-10' : '',
    rightIcon ? 'pr-10' : '',
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={`form-group ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400 text-sm">
              {leftIcon}
            </div>
          </div>
        )}
        
        <input
          id={inputId}
          className={inputClasses}
          {...props}
        />
        
            {rightIcon && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <div className="text-gray-400 text-sm">
            {rightIcon}
          </div>
        </div>
      )}
      </div>
      
      {error && (
        <div className="form-error animate-shake">
          {error}
        </div>
      )}
      
      {!error && helperText && (
        <div className="mt-1 text-xs text-gray-500">
          {helperText}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';
