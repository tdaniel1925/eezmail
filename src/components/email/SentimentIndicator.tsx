'use client';

import { useState, useEffect } from 'react';
import { Smile, Meh, Frown, AlertTriangle, Zap, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SentimentData {
  sentiment:
    | 'positive'
    | 'neutral'
    | 'negative'
    | 'urgent'
    | 'anxious'
    | 'angry';
  score: number;
  confidence: 'high' | 'medium' | 'low';
  summary?: string;
  keyIndicators?: string[];
  isHarsh?: boolean;
  suggestions?: string;
}

interface SentimentIndicatorProps {
  emailId: string;
  subject?: string;
  bodyText: string;
  className?: string;
  showDetails?: boolean;
}

export function SentimentIndicator({
  emailId,
  subject,
  bodyText,
  className,
  showDetails = false,
}: SentimentIndicatorProps): JSX.Element {
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Analyze sentiment on component mount
  useEffect(() => {
    analyzeSentiment();
  }, [emailId]);

  const analyzeSentiment = async (): Promise<void> => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/analyze-sentiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailId,
          subject,
          bodyText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze sentiment');
      }

      const data = await response.json();

      if (data.success) {
        setSentiment(data);
      }
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentIcon = (type: SentimentData['sentiment']) => {
    switch (type) {
      case 'positive':
        return <Smile className="h-4 w-4" />;
      case 'neutral':
        return <Meh className="h-4 w-4" />;
      case 'negative':
        return <Frown className="h-4 w-4" />;
      case 'angry':
        return <AlertTriangle className="h-4 w-4" />;
      case 'urgent':
        return <Zap className="h-4 w-4" />;
      case 'anxious':
        return <Heart className="h-4 w-4" />;
      default:
        return <Meh className="h-4 w-4" />;
    }
  };

  const getSentimentColor = (
    type: SentimentData['sentiment']
  ): { bg: string; text: string; border: string } => {
    switch (type) {
      case 'positive':
        return {
          bg: 'bg-green-100 dark:bg-green-500/20',
          text: 'text-green-700 dark:text-green-400',
          border: 'border-green-300 dark:border-green-500/30',
        };
      case 'neutral':
        return {
          bg: 'bg-gray-100 dark:bg-gray-500/20',
          text: 'text-gray-700 dark:text-gray-400',
          border: 'border-gray-300 dark:border-gray-500/30',
        };
      case 'negative':
        return {
          bg: 'bg-orange-100 dark:bg-orange-500/20',
          text: 'text-orange-700 dark:text-orange-400',
          border: 'border-orange-300 dark:border-orange-500/30',
        };
      case 'angry':
        return {
          bg: 'bg-red-100 dark:bg-red-500/20',
          text: 'text-red-700 dark:text-red-400',
          border: 'border-red-300 dark:border-red-500/30',
        };
      case 'urgent':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-500/20',
          text: 'text-yellow-700 dark:text-yellow-400',
          border: 'border-yellow-300 dark:border-yellow-500/30',
        };
      case 'anxious':
        return {
          bg: 'bg-purple-100 dark:bg-purple-500/20',
          text: 'text-purple-700 dark:text-purple-400',
          border: 'border-purple-300 dark:border-purple-500/30',
        };
      default:
        return {
          bg: 'bg-gray-100 dark:bg-gray-500/20',
          text: 'text-gray-700 dark:text-gray-400',
          border: 'border-gray-300 dark:border-gray-500/30',
        };
    }
  };

  if (isLoading || !sentiment) {
    return <></>;
  }

  const colors = getSentimentColor(sentiment.sentiment);

  // Compact mode (just icon)
  if (!showDetails) {
    return (
      <div
        className={cn(
          'flex items-center gap-1 rounded-full px-2 py-1 border',
          colors.bg,
          colors.text,
          colors.border,
          className
        )}
        title={`${sentiment.sentiment} (${sentiment.confidence} confidence)`}
      >
        {getSentimentIcon(sentiment.sentiment)}
        <span className="text-xs font-medium capitalize">
          {sentiment.sentiment}
        </span>
      </div>
    );
  }

  // Detailed mode
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        colors.bg,
        colors.border,
        className
      )}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className={colors.text}>
            {getSentimentIcon(sentiment.sentiment)}
          </span>
          <h3 className={cn('text-sm font-semibold', colors.text)}>
            Sentiment: {sentiment.sentiment}
          </h3>
        </div>
        <span className={cn('text-xs', colors.text)}>
          {isExpanded ? 'Hide details' : 'Show details'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {sentiment.summary && (
            <p className="text-sm text-gray-700 dark:text-white/70">
              {sentiment.summary}
            </p>
          )}

          <div className="flex items-center justify-between text-xs">
            <span className={colors.text}>
              Score: {sentiment.score > 0 ? '+' : ''}
              {sentiment.score}
            </span>
            <span className={colors.text}>
              Confidence: {sentiment.confidence}
            </span>
          </div>

          {sentiment.keyIndicators && sentiment.keyIndicators.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-gray-700 dark:text-white/70 mb-1">
                Key indicators:
              </p>
              <div className="flex flex-wrap gap-1">
                {sentiment.keyIndicators.map((indicator, index) => (
                  <span
                    key={index}
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      colors.bg,
                      colors.text
                    )}
                  >
                    {indicator}
                  </span>
                ))}
              </div>
            </div>
          )}

          {sentiment.isHarsh && sentiment.suggestions && (
            <div className="mt-3 rounded-md bg-yellow-100 dark:bg-yellow-500/20 border border-yellow-300 dark:border-yellow-500/30 p-2">
              <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                ⚠️ Tone Warning
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                {sentiment.suggestions}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

