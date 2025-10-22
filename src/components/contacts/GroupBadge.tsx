'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GroupBadgeProps {
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
}

export function GroupBadge({
  name,
  color,
  size = 'md',
  removable = false,
  onRemove,
  className,
}: GroupBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium transition-all',
        sizeClasses[size],
        removable && 'pr-1',
        className
      )}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        borderWidth: '1px',
        borderColor: `${color}40`,
      }}
    >
      {/* Color indicator dot */}
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />

      <span className="truncate max-w-[150px]">{name}</span>

      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label={`Remove ${name}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

