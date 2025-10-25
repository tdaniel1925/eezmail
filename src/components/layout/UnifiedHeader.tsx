'use client';

import { useState } from 'react';
import {
  Search,
  Settings,
  RefreshCw,
  Sun,
  Moon,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface HeaderAction {
  id: string;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}

interface UnifiedHeaderProps {
  title: string;
  subtitle?: string;
  actions?: HeaderAction[];
  showSettings?: boolean;
  showThemeToggle?: boolean;
  leftActions?: React.ReactNode;
  customActions?: React.ReactNode;
  onToggleSidebar?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
  // Search props
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
}

export function UnifiedHeader({
  title,
  subtitle,
  actions = [],
  showSettings = true,
  showThemeToggle = true,
  leftActions,
  customActions,
  onToggleSidebar,
  onRefresh,
  isRefreshing = false,
  className,
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
}: UnifiedHeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const defaultActions: HeaderAction[] = [
    ...actions,
    ...(onRefresh
      ? [
          {
            id: 'refresh',
            label: isRefreshing ? 'Refreshing...' : 'Refresh',
            icon: RefreshCw,
            onClick: onRefresh,
            disabled: isRefreshing,
          },
        ]
      : []),
  ];

  return (
    <header
      className={cn(
        'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700',
        'px-6 py-4 h-16 flex items-center justify-between',
        className
      )}
    >
      {/* Left Section: Title & Sidebar Toggle */}
      <div className="flex items-center gap-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        )}

        {/* Left Actions (e.g., bulk select checkbox) */}
        {leftActions && <div className="flex items-center">{leftActions}</div>}

        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Center Section: Search Bar */}
      <div className="flex-1 max-w-lg mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Right Section: Actions & Settings */}
      <div className="flex items-center gap-2">
        {/* Custom Actions */}
        {customActions}

        {/* Default Actions */}
        {defaultActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                action.variant === 'primary' &&
                  'bg-blue-600 text-white hover:bg-blue-700',
                action.variant === 'secondary' &&
                  'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
                !action.variant &&
                  'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
                action.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4',
                  action.id === 'refresh' && isRefreshing && 'animate-spin'
                )}
              />
              <span>{action.label}</span>
            </button>
          );
        })}

        {/* Notification Bell */}
        <NotificationBell />

        {/* Settings Dropdown */}
        {showSettings && (
          <div className="relative">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Settings"
            >
              <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>

            {isSettingsOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsSettingsOpen(false)}
                />

                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
                  <div className="py-2">
                    {/* Refresh Option */}
                    {onRefresh && (
                      <button
                        onClick={() => {
                          onRefresh();
                          setIsSettingsOpen(false);
                        }}
                        disabled={isRefreshing}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        <RefreshCw
                          className={cn(
                            'h-4 w-4',
                            isRefreshing && 'animate-spin'
                          )}
                        />
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                      </button>
                    )}

                    {/* Theme Toggle */}
                    {showThemeToggle && (
                      <button
                        onClick={() => {
                          toggleTheme();
                          setIsSettingsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {theme === 'dark' ? (
                          <>
                            <Sun className="h-4 w-4" />
                            Light Mode
                          </>
                        ) : (
                          <>
                            <Moon className="h-4 w-4" />
                            Dark Mode
                          </>
                        )}
                      </button>
                    )}

                    {/* Settings Link */}
                    <button
                      onClick={() => {
                        window.location.href = '/dashboard/settings';
                        setIsSettingsOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
