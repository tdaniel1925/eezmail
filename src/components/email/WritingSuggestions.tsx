'use client';

import { X, CheckCircle, AlertCircle, Info, Lightbulb } from 'lucide-react';
import { useState } from 'react';

interface WritingSuggestion {
  type: 'spelling' | 'grammar' | 'style' | 'clarity' | 'tone';
  original: string;
  suggestion: string;
  explanation: string;
}

interface WritingSuggestionsProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: WritingSuggestion[];
  correctedText: string;
  summary: string;
  isLoading: boolean;
  onApply: (text: string) => void;
  onApplySingle: (original: string, suggestion: string) => void;
}

const SUGGESTION_ICONS = {
  spelling: AlertCircle,
  grammar: AlertCircle,
  style: Lightbulb,
  clarity: Info,
  tone: Info,
};

const SUGGESTION_COLORS = {
  spelling: 'text-red-500',
  grammar: 'text-orange-500',
  style: 'text-blue-500',
  clarity: 'text-purple-500',
  tone: 'text-green-500',
};

export function WritingSuggestions({
  isOpen,
  onClose,
  suggestions,
  correctedText,
  summary,
  isLoading,
  onApply,
  onApplySingle,
}: WritingSuggestionsProps): JSX.Element | null {
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(
    null
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[80vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Writing Suggestions
            </h2>
            {summary && !isLoading && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {summary}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-180px)] p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">
                Analyzing your writing...
              </p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Looks great!
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                No issues found with your writing.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => {
                const Icon = SUGGESTION_ICONS[suggestion.type];
                const color = SUGGESTION_COLORS[suggestion.type];

                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedSuggestion === index
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() =>
                      setSelectedSuggestion(
                        selectedSuggestion === index ? null : index
                      )
                    }
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${color}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            {suggestion.type}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Original:
                            </span>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-through mt-1">
                              {suggestion.original}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Suggested:
                            </span>
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                              {suggestion.suggestion}
                            </p>
                          </div>
                        </div>
                        {selectedSuggestion === index && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {suggestion.explanation}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onApplySingle(
                                  suggestion.original,
                                  suggestion.suggestion
                                );
                              }}
                              className="mt-2 text-sm text-primary hover:underline"
                            >
                              Apply this suggestion
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && suggestions.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {suggestions.length} suggestion
                {suggestions.length !== 1 ? 's' : ''} found
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => onApply(correctedText)}
                  className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                >
                  Apply All Suggestions
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
