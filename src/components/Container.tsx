/**
 * Container Component
 * Responsive container with consistent max-widths and centering
 */

import React from 'react';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | 'full';
  center?: boolean;
  fluid?: boolean;
}

export const Container: React.FC<ContainerProps> = React.memo(({
  maxWidth = 'lg',
  center = true,
  fluid = false,
  className = '',
  children,
  ...props
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    full: 'max-w-full'
  };
  
  const centerClasses = center ? 'mx-auto' : '';
  const fluidClasses = fluid ? 'px-4 sm:px-6 lg:px-8' : '';
  
  const allClasses = [
    !fluid ? maxWidthClasses[maxWidth] : 'w-full',
    centerClasses,
    fluidClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={allClasses} {...props}>
      {children}
    </div>
  );
});

Container.displayName = 'Container';
