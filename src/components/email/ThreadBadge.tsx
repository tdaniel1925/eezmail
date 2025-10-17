'use client';

import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThreadBadgeProps {
  count: number;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}

export function ThreadBadge({ count, onClick, className }: ThreadBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
        'bg-primary/10 hover:bg-primary/20 text-primary',
        'text-xs font-medium transition-colors duration-200',
        'group relative',
        className
      )}
      title={`View ${count} messages in thread`}
    >
      <MessageCircle size={12} className="flex-shrink-0" />
      <span>{count}</span>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        View thread
      </div>
    </button>
  );
}
