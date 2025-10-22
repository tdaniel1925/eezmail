'use client';

import { useState } from 'react';
import { Repeat, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COMMON_PATTERNS, describeRRule } from '@/lib/calendar/recurrence';

interface RecurrenceSelectorProps {
  value: string | null;
  startDate: Date;
  onChange: (rrule: string | null) => void;
}

export function RecurrenceSelector({
  value,
  startDate,
  onChange,
}: RecurrenceSelectorProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  const currentPattern = value
    ? Object.entries(COMMON_PATTERNS).find(
        ([_, pattern]) => pattern.rrule(startDate) === value
      )?.[0]
    : null;

  const handleSelect = (patternKey: string | null) => {
    if (patternKey === null) {
      onChange(null);
    } else {
      const pattern = COMMON_PATTERNS[patternKey as keyof typeof COMMON_PATTERNS];
      onChange(pattern.rrule(startDate));
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        <Repeat className="h-4 w-4 inline mr-1" />
        Repeat
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full px-4 py-2 border rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500',
          'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
          'border-gray-300 dark:border-gray-700',
          value && 'border-blue-500 dark:border-blue-400'
        )}
      >
        {value ? (
          <div className="flex items-center justify-between">
            <span className="text-sm">{describeRRule(value)}</span>
            <X
              className="h-4 w-4 text-gray-500 hover:text-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(null);
              }}
            />
          </div>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">Does not repeat</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
          >
            <div className="text-sm text-gray-900 dark:text-white">Does not repeat</div>
          </button>

          {Object.entries(COMMON_PATTERNS).map(([key, pattern]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSelect(key)}
              className={cn(
                'w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700',
                currentPattern === key && 'bg-blue-50 dark:bg-blue-900/20'
              )}
            >
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {pattern.label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {describeRRule(pattern.rrule(startDate))}
              </div>
            </button>
          ))}
        </div>
      )}

      {value && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          This event will repeat according to the rule above
        </div>
      )}
    </div>
  );
}

