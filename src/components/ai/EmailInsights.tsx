'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertCircle,
  CheckCircle,
  Calendar,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Email } from '@/db/schema';

interface EmailInsightsProps {
  email: Email | null;
}

interface Insights {
  summary?: string;
  sentiment?: 'urgent' | 'neutral' | 'friendly';
  actionItems?: string[];
  threadCount?: number;
  meeting?: {
    detected: boolean;
    date?: string;
    time?: string;
  };
}

export function EmailInsights({ email }: EmailInsightsProps): JSX.Element {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) {
      setInsights(null);
      return;
    }

    const fetchInsights = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/email-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailId: email.id }),
        });

        if (!response.ok) throw new Error('Failed to fetch insights');

        const data = await response.json();
        setInsights(data);
      } catch (err) {
        console.error('Insights error:', err);
        setError('Unable to load insights');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [email?.id]);

  if (!email) {
    return (
      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Select an email to see insights
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Analyzing email...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-sm text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (!insights) return null;

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'urgent':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
      case 'friendly':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  return (
    <div className="space-y-3 p-4">
      {/* Sentiment Badge */}
      {insights.sentiment && (
        <div
          className={cn(
            'inline-flex items-center space-x-1.5 rounded-full px-3 py-1 text-xs font-medium',
            getSentimentColor(insights.sentiment)
          )}
        >
          <Sparkles className="h-3 w-3" />
          <span className="capitalize">{insights.sentiment}</span>
        </div>
      )}

      {/* Summary */}
      {insights.summary && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
          <h4 className="mb-1 flex items-center space-x-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Key Points</span>
          </h4>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {insights.summary}
          </p>
        </div>
      )}

      {/* Action Items */}
      {insights.actionItems && insights.actionItems.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
          <h4 className="mb-2 flex items-center space-x-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Action Items</span>
          </h4>
          <ul className="space-y-1">
            {insights.actionItems.map((item, index) => (
              <li
                key={index}
                className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Meeting Detection */}
      {insights.meeting?.detected && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-900/20">
          <h4 className="mb-1 flex items-center space-x-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
            <Calendar className="h-3.5 w-3.5" />
            <span>Meeting Detected</span>
          </h4>
          {insights.meeting.date && (
            <p className="text-sm text-blue-600 dark:text-blue-400">
              {insights.meeting.date}
              {insights.meeting.time && ` at ${insights.meeting.time}`}
            </p>
          )}
        </div>
      )}

      {/* Thread Info */}
      {insights.threadCount && insights.threadCount > 1 && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium">{insights.threadCount} emails</span> in
          this thread
        </div>
      )}
    </div>
  );
}
