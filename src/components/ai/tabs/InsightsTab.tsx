'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Users,
  CheckSquare,
  Paperclip,
  Loader2,
  AlertCircle,
  Mail,
} from 'lucide-react';
import { Email } from '@/stores/aiPanelStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getThreadEmails } from '@/lib/email/thread-actions';
import { formatDistanceToNow } from 'date-fns';
import { EmptyState } from '../EmptyStates';

interface InsightsTabProps {
  currentEmail: Email | null;
}

interface ThreadAnalysis {
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  keyPoints: string[];
  conversationFlow: string;
  participants: string[];
  actionItems: Array<{
    task: string;
    dueDate: string | null;
    priority: 'high' | 'medium' | 'low';
  }>;
  decisions: string[];
  questions: string[];
}

export function InsightsTab({ currentEmail }: InsightsTabProps): JSX.Element {
  const [threadEmails, setThreadEmails] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<ThreadAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentEmail?.threadId) {
      loadThreadData();
    } else if (currentEmail) {
      // If no thread, still try to get single email insights
      loadSingleEmailInsights();
    } else {
      setThreadEmails([]);
      setAnalysis(null);
    }
  }, [currentEmail?.threadId, currentEmail?.id]);

  const loadThreadData = async () => {
    if (!currentEmail?.threadId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch thread emails
      const result = await getThreadEmails(currentEmail.threadId);

      if (result.success && result.emails) {
        setThreadEmails(result.emails);

        // Analyze thread with AI
        const analysisResponse = await fetch('/api/ai/thread-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emails: result.emails }),
        });

        if (analysisResponse.ok) {
          const { analysis: threadAnalysis } = await analysisResponse.json();
          setAnalysis(threadAnalysis);
        } else {
          throw new Error('Failed to analyze thread');
        }
      } else {
        setError(result.error || 'Failed to load thread');
      }
    } catch (err) {
      console.error('Error loading thread data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load thread');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSingleEmailInsights = async () => {
    if (!currentEmail) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/email-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId: currentEmail.id }),
      });

      if (response.ok) {
        const data = await response.json();
        // Convert email insights to thread analysis format
        setAnalysis({
          summary: data.summary || 'No summary available',
          sentiment: data.sentiment || 'neutral',
          keyPoints: data.keyPoints || [],
          conversationFlow: 'Single email (not part of a thread)',
          participants: [currentEmail.from],
          actionItems: data.actionItems?.map((item: string) => ({
            task: item,
            dueDate: null,
            priority: 'medium' as const,
          })) || [],
          decisions: [],
          questions: [],
        });
        setThreadEmails([]);
      } else {
        throw new Error('Failed to analyze email');
      }
    } catch (err) {
      console.error('Error loading email insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze email');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentEmail) {
    return <EmptyState type="insights" />;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Analyzing...
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          AI is analyzing the email
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Analysis Failed
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={() => currentEmail.threadId ? loadThreadData() : loadSingleEmailInsights()}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          No Analysis Available
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Unable to analyze this email
        </p>
      </div>
    );
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'negative':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'low':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const threadAttachments = threadEmails
    .filter((email) => email.hasAttachments)
    .flatMap((email) => email.attachmentMetadata || []);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {/* Thread Info (if available) */}
      {threadEmails.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Mail className="h-4 w-4" />
          <span>
            {threadEmails.length} email{threadEmails.length !== 1 ? 's' : ''} in thread
            {threadEmails.length > 0 &&
              ` • Started ${formatDistanceToNow(
                new Date(threadEmails[0].sentAt || threadEmails[0].receivedAt),
                { addSuffix: true }
              )}`}
          </span>
        </div>
      )}

      {/* Summary */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          Summary
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {analysis.summary}
        </p>
      </div>

      {/* Sentiment */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Sentiment</h4>
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
            getSentimentColor(analysis.sentiment)
          )}
        >
          {analysis.sentiment.charAt(0).toUpperCase() + analysis.sentiment.slice(1)}
        </span>
      </div>

      {/* Key Points */}
      {analysis.keyPoints && analysis.keyPoints.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Key Points</h4>
          <ul className="space-y-1.5">
            {analysis.keyPoints.map((point, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items */}
      {analysis.actionItems && analysis.actionItems.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            Action Items
          </h4>
          <div className="space-y-2">
            {analysis.actionItems.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">{item.task}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {item.dueDate && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Due: {item.dueDate}
                      </span>
                    )}
                    <span
                      className={cn('text-xs font-medium', getPriorityColor(item.priority))}
                    >
                      {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} Priority
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decisions */}
      {analysis.decisions && analysis.decisions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Decisions Made</h4>
          <ul className="space-y-1.5">
            {analysis.decisions.map((decision, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                <span>{decision}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Open Questions */}
      {analysis.questions && analysis.questions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Open Questions</h4>
          <ul className="space-y-1.5">
            {analysis.questions.map((question, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                <span>{question}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Participants */}
      {analysis.participants && analysis.participants.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Participants
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.participants.map((participant, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
              >
                {participant}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Attachments */}
      {threadAttachments.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-primary" />
            Attachments
          </h4>
          <div className="space-y-2">
            {threadAttachments.slice(0, 5).map((attachment: any, index: number) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 rounded-md bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {attachment.filename || 'Untitled'}
                  </p>
                  {attachment.size && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(attachment.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
              </div>
            ))}
            {threadAttachments.length > 5 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-1">
                +{threadAttachments.length - 5} more attachments
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

