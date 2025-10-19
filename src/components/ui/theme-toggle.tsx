'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps): JSX.Element {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-[120px] h-10" />;
  }

  const toggleTheme = (): void => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200',
        'bg-[var(--bg-tertiary)] border-[var(--border-color)]',
        'text-[var(--text-primary)] hover:bg-[var(--item-hover)]',
        'hover:border-[var(--accent-blue)] text-sm font-medium',
        className
      )}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <>
          <Moon size={16} />
          <span>Dark Mode</span>
        </>
      ) : (
        <>
          <Sun size={16} />
          <span>Light Mode</span>
        </>
      )}
    </button>
  );
}
