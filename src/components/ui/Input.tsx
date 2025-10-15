'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-white/80">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'h-10 w-full rounded-lg border px-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2',
            error
              ? 'border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-200 dark:border-white/10 focus:border-gray-300 dark:focus:border-white/20 focus:ring-gray-300/20 dark:focus:ring-white/10',
            'bg-white/60 dark:bg-white/5 backdrop-blur-md',
            'text-gray-900 dark:text-white',
            'placeholder-gray-500 dark:placeholder-white/40',
            props.disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs text-gray-600 dark:text-white/60">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';


