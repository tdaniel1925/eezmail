'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md transition-all duration-200',
          className
        )}
        aria-label="Toggle theme"
      >
        <div className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={cn(
        'group flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20',
        className
      )}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-gray-700 dark:text-white/70 transition-colors duration-200 group-hover:text-gray-900 dark:group-hover:text-white" />
      ) : (
        <Moon className="h-4 w-4 text-gray-700 dark:text-white/70 transition-colors duration-200 group-hover:text-gray-900 dark:group-hover:text-white" />
      )}
    </button>
  );
}
