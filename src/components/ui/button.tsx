'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    };

    const variantClasses = {
      primary:
        'bg-gray-200/80 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-300/80 dark:hover:bg-white/15',
      secondary:
        'border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 text-gray-700 dark:text-white/70 hover:bg-gray-100/80 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white',
      ghost:
        'text-gray-700 dark:text-white/70 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white',
      danger:
        'bg-red-500/90 dark:bg-red-500/80 border border-red-600 dark:border-red-400 text-white hover:bg-red-600/90 dark:hover:bg-red-600/80',
    };

    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-white/10 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {!asChild && isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

// Export buttonVariants for compatibility with alert-dialog and other components
export const buttonVariants = ({
  variant = 'primary',
  size = 'md',
  className = '',
}: {
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
}) => {
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  const variantClasses = {
    primary:
      'bg-gray-200/80 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-300/80 dark:hover:bg-white/15',
    secondary:
      'border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 text-gray-700 dark:text-white/70 hover:bg-gray-100/80 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white',
    ghost:
      'text-gray-700 dark:text-white/70 hover:bg-gray-100/80 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white',
    danger:
      'bg-red-500/90 dark:bg-red-500/80 border border-red-600 dark:border-red-400 text-white hover:bg-red-600/90 dark:hover:bg-red-600/80',
  };

  return cn(
    'rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-white/10 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2',
    variantClasses[variant || 'primary'],
    sizeClasses[size || 'md'],
    className
  );
};