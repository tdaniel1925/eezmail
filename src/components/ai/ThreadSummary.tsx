'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertCircle,
  CheckCircle,
  Calendar,
  MessageSquare,
  Loader2,
  Users,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Email } from '@/db/schema';

interface ThreadSummaryProps {
  email: Email | null;
}

interface ThreadInsights {
  summary?: string;
  sentiment?: 'urgent' | 'neutral' | 'friendly';
  actionItems?: string[];
  threadCount?: number;
  participants?: { name: string; email: string; role: string }[];
  keyDecisions?: string[];
  nextSteps?: string[];
  meeting?: {
    detected: boolean;
    date?: string;
    time?: string;
  };
  responseExpected?: boolean;
  estimatedResponseTime?: string;
}

export function ThreadSummary({ email }: ThreadSummaryProps): JSX.Element {
  const [insights, setInsights] = useState<ThreadInsights | null>(null);
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
        console.error('Thread insights error:', err);
        setError('Unable to load thread summary');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [email?.id]);

  if (!email) {
    return (
      <div className="p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
          Thread Summary
        </h3>
        <div className="text-left text-sm text-gray-500 dark:text-gray-400">
          Select an email to see thread summary
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
          Thread Summary
        </h3>
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 py-8">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Analyzing conversation...</span>
        </div>
      </div>
    );
  }

  // Always show basic email info, even if AI insights fail
  const hasAIInsights = insights && !error;

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'urgent':
        return <AlertCircle className="h-3.5 w-3.5" />;
      case 'friendly':
        return <CheckCircle className="h-3.5 w-3.5" />;
      default:
        return <MessageSquare className="h-3.5 w-3.5" />;
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case 'friendly':
        return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    }
  };

  return (
    <div className="space-y-4 p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Thread Summary
        </h3>
        {hasAIInsights && insights.threadCount && insights.threadCount > 1 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {insights.threadCount} messages
          </span>
        )}
      </div>

      {/* Basic Email Info - Always show */}
      <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="space-y-2">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Subject
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
              {email.subject || '(No subject)'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              From
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {email.fromAddress?.name || email.fromAddress?.email || 'Unknown'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Date
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {new Date(email.receivedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Loading state for AI insights */}
      {isLoading && (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading AI insights...</span>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
          AI insights unavailable
        </div>
      )}

      {/* Sentiment Badge */}
      {hasAIInsights && insights.sentiment && (
        <div
          className={cn(
            'inline-flex items-center space-x-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium',
            getSentimentColor(insights.sentiment)
          )}
        >
          {getSentimentIcon(insights.sentiment)}
          <span className="capitalize">{insights.sentiment}</span>
        </div>
      )}

      {/* AI Summary */}
      {hasAIInsights && insights.summary && (
        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-2 flex items-center space-x-1.5">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              AI Summary
            </h4>
          </div>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            {insights.summary}
          </p>
        </div>
      )}

      {/* Participants */}
      {hasAIInsights &&
        insights.participants &&
        insights.participants.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 flex items-center space-x-1.5">
              <Users className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Participants ({insights.participants.length})
              </h4>
            </div>
            <div className="space-y-1.5">
              {insights.participants.slice(0, 3).map((participant, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-gray-700 dark:text-gray-300">
                    {participant.name}
                  </span>
                  <span className="text-gray-500 dark:text-gray-500">
                    {participant.role}
                  </span>
                </div>
              ))}
              {insights.participants.length > 3 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  +{insights.participants.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}

      {/* Key Decisions */}
      {hasAIInsights &&
        insights.keyDecisions &&
        insights.keyDecisions.length > 0 && (
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-900 dark:bg-purple-900/20">
            <div className="mb-2 flex items-center space-x-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <h4 className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                Key Decisions
              </h4>
            </div>
            <ul className="space-y-1.5">
              {insights.keyDecisions.map((decision, index) => (
                <li
                  key={index}
                  className="flex items-start space-x-2 text-sm text-purple-700 dark:text-purple-300"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-600 dark:bg-purple-400" />
                  <span>{decision}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Action Items */}
      {hasAIInsights &&
        insights.actionItems &&
        insights.actionItems.length > 0 && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-900/20">
            <div className="mb-2 flex items-center space-x-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
              <h4 className="text-xs font-semibold text-orange-700 dark:text-orange-300">
                Action Items
              </h4>
            </div>
            <ul className="space-y-1.5">
              {insights.actionItems.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start space-x-2 text-sm text-orange-700 dark:text-orange-300"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-600 dark:bg-orange-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Next Steps */}
      {hasAIInsights && insights.nextSteps && insights.nextSteps.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-900/20">
          <div className="mb-2 flex items-center space-x-1.5">
            <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              Next Steps
            </h4>
          </div>
          <ul className="space-y-1.5">
            {insights.nextSteps.map((step, index) => (
              <li
                key={index}
                className="flex items-start space-x-2 text-sm text-blue-700 dark:text-blue-300"
              >
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600 dark:bg-blue-400" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Meeting Detection */}
      {insights.meeting?.detected && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-900/20">
          <div className="mb-1.5 flex items-center space-x-1.5">
            <Calendar className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            <h4 className="text-xs font-semibold text-green-700 dark:text-green-300">
              Meeting Detected
            </h4>
          </div>
          {insights.meeting.date && (
            <p className="text-sm text-green-700 dark:text-green-300">
              {insights.meeting.date}
              {insights.meeting.time && ` at ${insights.meeting.time}`}
            </p>
          )}
          <button className="mt-2 w-full rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors">
            Add to Calendar
          </button>
        </div>
      )}

      {/* Response Expected */}
      {insights.responseExpected && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-2.5 dark:border-yellow-900 dark:bg-yellow-900/20">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-yellow-700 dark:text-yellow-300">
              Response expected
            </span>
            {insights.estimatedResponseTime && (
              <span className="text-yellow-600 dark:text-yellow-400">
                {insights.estimatedResponseTime}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
