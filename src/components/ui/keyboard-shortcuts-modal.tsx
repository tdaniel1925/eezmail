'use client';

import { useEffect, useState } from 'react';
import { X, Command } from 'lucide-react';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Navigation
  { keys: ['⌘', 'K'], description: 'Search settings', category: 'Navigation' },
  { keys: ['G', 'I'], description: 'Go to Inbox', category: 'Navigation' },
  { keys: ['G', 'S'], description: 'Go to Sent', category: 'Navigation' },
  { keys: ['G', 'D'], description: 'Go to Drafts', category: 'Navigation' },

  // Actions
  { keys: ['⌘', 'N'], description: 'New email', category: 'Actions' },
  { keys: ['⌘', 'S'], description: 'Sync all accounts', category: 'Actions' },
  {
    keys: ['⌘', 'Enter'],
    description: 'Send email',
    category: 'Actions',
  },
  { keys: ['R'], description: 'Reply', category: 'Actions' },
  { keys: ['A'], description: 'Reply all', category: 'Actions' },
  { keys: ['F'], description: 'Forward', category: 'Actions' },

  // Selection
  { keys: ['J'], description: 'Next email', category: 'Selection' },
  { keys: ['K'], description: 'Previous email', category: 'Selection' },
  { keys: ['X'], description: 'Select email', category: 'Selection' },

  // General
  { keys: ['?'], description: 'Show this help', category: 'General' },
  { keys: ['Esc'], description: 'Close modal', category: 'General' },
];

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show shortcuts modal on "?"
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        setIsOpen(true);
      }

      // Close on Escape
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Command className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Shortcuts by category */}
        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts
                  .filter((s) => s.category === category)
                  .map((shortcut, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, j) => (
                          <kbd
                            key={j}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-xs font-mono"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Press{' '}
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
              ?
            </kbd>{' '}
            anytime to show this menu
          </p>
        </div>
      </div>
    </div>
  );
}

