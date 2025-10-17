'use client';

import { useEffect, useState } from 'react';

interface SmartComposeProps {
  text: string;
  onAccept: (suggestion: string) => void;
  context?: string;
}

export function SmartCompose({
  text,
  onAccept,
  context,
}: SmartComposeProps): JSX.Element | null {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async (): Promise<void> => {
      const plainText = text.replace(/<[^>]*>/g, '');

      // Only fetch if user is actively typing (text ends without punctuation)
      if (
        plainText.length < 10 ||
        plainText.trim().endsWith('.') ||
        plainText.trim().endsWith('!') ||
        plainText.trim().endsWith('?')
      ) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch('/api/ai/smart-compose', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: plainText, context }),
        });

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(data.suggestions && data.suggestions.length > 0);
        }
      } catch (error) {
        console.error('Smart compose error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the suggestion fetching
    const timer = setTimeout(fetchSuggestions, 1000);

    return () => clearTimeout(timer);
  }, [text, context]);

  // Listen for Tab key to accept suggestion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Tab' && showSuggestions && suggestions.length > 0) {
        e.preventDefault();
        onAccept(suggestions[0]);
        setShowSuggestions(false);
        setSuggestions([]);
      } else if (e.key === 'Escape' && showSuggestions) {
        setShowSuggestions(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSuggestions, suggestions, onAccept]);

  if (!showSuggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-8 z-40 w-96 bg-white dark:bg-gray-800 border-2 border-primary rounded-lg shadow-xl p-4 animate-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Smart Compose
          </span>
        </div>
        <button
          onClick={() => setShowSuggestions(false)}
          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Dismiss
        </button>
      </div>

      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => {
              onAccept(suggestion);
              setShowSuggestions(false);
              setSuggestions([]);
            }}
            className="w-full text-left px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            <span className="text-gray-700 dark:text-gray-300">
              {suggestion}
            </span>
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
        Press{' '}
        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
          Tab
        </kbd>{' '}
        to accept first suggestion
      </p>
    </div>
  );
}
