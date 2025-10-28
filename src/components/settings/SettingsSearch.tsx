'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsSearchProps {
  tabs: Array<{
    id: string;
    label: string;
    description?: string;
    keywords?: string[];
  }>;
  onTabSelect: (tabId: string) => void;
}

export function SettingsSearch({ tabs, onTabSelect }: SettingsSearchProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const filteredResults = useMemo(() => {
    if (!query) return [];

    const lowerQuery = query.toLowerCase();
    return tabs.filter((tab) => {
      const searchText = [tab.label, tab.description, ...(tab.keywords || [])]
        .join(' ')
        .toLowerCase();

      return searchText.includes(lowerQuery);
    });
  }, [query, tabs]);

  const handleSelectResult = (tabId: string) => {
    onTabSelect(tabId);
    setQuery('');
    setIsFocused(false);
  };

  // Keyboard shortcut handler (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('settings-search');
        input?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative mb-6">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          id="settings-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder="Search settings..."
          className="w-full pl-10 pr-10 py-2 border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-white/5 backdrop-blur-md rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full p-1 transition-colors"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        )}
      </div>

      {/* Search results dropdown */}
      {isFocused && query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50 backdrop-blur-md">
          {filteredResults.length > 0 ? (
            <div className="py-2">
              {filteredResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectResult(result.id)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {result.label}
                  </div>
                  {result.description && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {result.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              No settings found for "{query}"
            </div>
          )}
        </div>
      )}

      {/* Keyboard shortcut hint */}
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Press{' '}
        <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono border border-gray-300 dark:border-gray-600">
          {typeof navigator !== 'undefined' &&
          navigator.platform.toUpperCase().indexOf('MAC') >= 0
            ? '⌘'
            : 'Ctrl'}
          K
        </kbd>{' '}
        to search
      </div>
    </div>
  );
}

