'use client';

import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'particles' | 'premium';
  icon?: ReactNode;
  loading?: boolean;
  children: ReactNode;
}

export function AnimatedButton({
  variant = 'premium',
  icon,
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: AnimatedButtonProps): JSX.Element {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`animated-button animated-button-${variant} ${className}`}
    >
      {variant === 'particles' && (
        <div className="points-wrapper">
          {[...Array(10)].map((_, i) => (
            <i key={i} className="point" />
          ))}
        </div>
      )}

      <span className="button-inner">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          icon && <span className="button-icon">{icon}</span>
        )}
        <span>{children}</span>
      </span>
    </button>
  );
}
