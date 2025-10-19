'use client';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';

interface TopBarProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function TopBar({
  title,
  subtitle,
  className,
}: TopBarProps): JSX.Element {
  return (
    <div
      className={cn(
        'px-8 py-5 border-b transition-all duration-300',
        'bg-[var(--bg-secondary)] border-[var(--border-color)]',
        'flex justify-between items-center',
        className
      )}
    >
      <div>
        <h2
          className="text-2xl font-bold mb-1 transition-colors duration-300"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="text-sm transition-colors duration-300"
            style={{ color: 'var(--text-secondary)' }}
          >
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>
    </div>
  );
}

