'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Wand2, CheckCircle2, Lightbulb, ChevronDown } from 'lucide-react';

interface AIAssistantMenuProps {
  onExpandText: () => void;
  onFixGrammar: () => void;
  onToggleCoach: () => void;
  isCoachOpen: boolean;
  isAIWriting: boolean;
  isRemixing: boolean;
  disabled?: boolean;
}

export function AIAssistantMenu({
  onExpandText,
  onFixGrammar,
  onToggleCoach,
  isCoachOpen,
  isAIWriting,
  isRemixing,
  disabled = false,
}: AIAssistantMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const isLoading = isAIWriting || isRemixing;

  return (
    <div className="relative" ref={menuRef}>
      {/* Main AI Assistant Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        className="flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        title="AI writing tools"
      >
        <Sparkles className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        <span>{isLoading ? 'Working...' : 'AI Assistant'}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-56 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-50">
          <div className="py-1">
            {/* Expand Text */}
            <button
              onClick={() => handleMenuItemClick(onExpandText)}
              disabled={isAIWriting}
              className="flex w-full items-center space-x-3 px-4 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  Expand Text
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Turn brief notes into full email
                </div>
              </div>
            </button>

            {/* Fix Grammar & Polish */}
            <button
              onClick={() => handleMenuItemClick(onFixGrammar)}
              disabled={isRemixing}
              className="flex w-full items-center space-x-3 px-4 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  Fix Grammar & Polish
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Improve spelling, grammar & style
                </div>
              </div>
            </button>

            {/* Divider */}
            <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

            {/* Writing Coach */}
            <button
              onClick={() => handleMenuItemClick(onToggleCoach)}
              className="flex w-full items-center space-x-3 px-4 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                isCoachOpen
                  ? 'bg-amber-100 dark:bg-amber-900/30'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <Lightbulb className={`h-4 w-4 ${
                  isCoachOpen
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white flex items-center justify-between">
                  <span>Writing Coach</span>
                  {isCoachOpen && (
                    <span className="text-xs text-amber-600 dark:text-amber-400">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Real-time writing suggestions
                </div>
              </div>
            </button>

            {/* Future: Smart Suggestions */}
            <button
              disabled
              className="flex w-full items-center space-x-3 px-4 py-2.5 text-left text-sm opacity-50 cursor-not-allowed"
              title="Coming soon"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                <Wand2 className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-500 dark:text-gray-400">
                  Smart Suggestions
                </div>
                <div className="text-xs text-gray-400">
                  Coming soon...
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

