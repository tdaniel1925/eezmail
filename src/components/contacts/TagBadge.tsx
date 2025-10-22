'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagBadgeProps {
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export function TagBadge({
  name,
  color,
  size = 'sm',
  removable = false,
  onRemove,
  className,
}: TagBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md font-medium transition-all',
        sizeClasses[size],
        removable && 'pr-1',
        className
      )}
      style={{
        backgroundColor: color,
        color: '#FFFFFF',
      }}
    >
      <span className="truncate max-w-[120px]">{name}</span>

      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full p-0.5 hover:bg-white/20 transition-colors"
          aria-label={`Remove ${name}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

