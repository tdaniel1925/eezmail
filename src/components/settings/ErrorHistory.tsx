'use client';

import { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorEntry {
  id: string;
  timestamp: Date;
  accountId: string;
  accountEmail: string;
  errorType: string;
  message: string;
  resolved: boolean;
  resolvedAt?: Date;
}

export function ErrorHistory() {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [patterns, setPatterns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadErrorHistory();
  }, []);

  useEffect(() => {
    if (errors.length > 0) {
      detectPatterns();
    }
  }, [errors]);

  const loadErrorHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/errors/history');
      const data = await response.json();
      setErrors(
        (data.errors || []).map((e: unknown) => ({
          ...(e as ErrorEntry),
          timestamp: new Date((e as ErrorEntry).timestamp),
          resolvedAt: (e as ErrorEntry).resolvedAt
            ? new Date((e as ErrorEntry).resolvedAt!)
            : undefined,
        }))
      );
    } catch (error) {
      console.error('Failed to load error history:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectPatterns = () => {
    const detectedPatterns: string[] = [];

    // Check for recurring errors
    const errorCounts = errors.reduce(
      (acc, err) => {
        acc[err.errorType] = (acc[err.errorType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    Object.entries(errorCounts).forEach(([type, count]) => {
      if (count >= 3) {
        detectedPatterns.push(`${type} occurred ${count} times`);
      }
    });

    // Check for time patterns
    const errorsByDay = errors.reduce(
      (acc, err) => {
        const day = err.timestamp.getDay();
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>
    );

    const maxDay = Object.entries(errorsByDay).reduce(
      (max, [day, count]) =>
        count > (errorsByDay[Number(max)] || 0) ? parseInt(day) : Number(max),
      0
    );

    if (errorsByDay[maxDay] >= 2) {
      const dayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      detectedPatterns.push(`Errors frequently occur on ${dayNames[maxDay]}`);
    }

    setPatterns(detectedPatterns);
  };

  const clearHistory = async () => {
    try {
      await fetch('/api/errors/history', { method: 'DELETE' });
      setErrors([]);
    } catch (error) {
      console.error('Failed to clear error history:', error);
    }
  };

  const filteredErrors = showResolved
    ? errors
    : errors.filter((e) => !e.resolved);

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading error history...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Error History</h3>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded"
            />
            Show resolved
          </label>
          <Button size="sm" variant="ghost" onClick={clearHistory}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear History
          </Button>
        </div>
      </div>

      {/* Pattern detection */}
      {patterns.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <TrendingUp className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                Patterns Detected
              </p>
              <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                {patterns.map((pattern, i) => (
                  <li key={i}>• {pattern}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Error list */}
      <div className="space-y-2">
        {filteredErrors.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No errors recorded</p>
          </div>
        ) : (
          filteredErrors.map((error) => (
            <div
              key={error.id}
              className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary transition-colors"
            >
              {error.resolved ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium text-sm">{error.accountEmail}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {error.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {error.timestamp.toLocaleString()}
                  {error.resolved && error.resolvedAt && (
                    <span className="text-green-600 ml-2">
                      • Resolved {error.resolvedAt.toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}


