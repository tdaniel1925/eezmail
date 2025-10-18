'use client';

import { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Users,
  Link2,
  CheckSquare,
  Paperclip,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Email } from '@/stores/aiPanelStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getThreadEmails } from '@/lib/email/thread-actions';
import { formatDistanceToNow } from 'date-fns';

interface ThreadSummaryTabProps {
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

interface AccordionSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function AccordionSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {title}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {isOpen && <div className="p-4 pt-0">{children}</div>}
    </div>
  );
}

export function ThreadSummaryTab({
  currentEmail,
}: ThreadSummaryTabProps): JSX.Element {
  const [threadEmails, setThreadEmails] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<ThreadAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentEmail?.threadId) {
      loadThreadData();
    } else {
      setThreadEmails([]);
      setAnalysis(null);
    }
  }, [currentEmail?.threadId]);

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
      toast.error('Failed to analyze thread');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentEmail) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          No Email Selected
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select an email to view thread summary and analysis
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Analyzing Thread...
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          AI is analyzing the conversation
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Analysis Failed
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={loadThreadData}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          No Analysis Available
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Unable to analyze this thread
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
    <div className="flex-1 overflow-y-auto">
      {/* Email Analysis */}
      <AccordionSection
        title="Email Analysis"
        icon={FileText}
        defaultOpen={true}
      >
        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Summary
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {analysis.summary}
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Sentiment
            </h4>
            <span
              className={cn(
                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                getSentimentColor(analysis.sentiment)
              )}
            >
              {analysis.sentiment.charAt(0).toUpperCase() +
                analysis.sentiment.slice(1)}
            </span>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Key Points
            </h4>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {analysis.keyPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
          {analysis.decisions && analysis.decisions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Decisions Made
              </h4>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {analysis.decisions.map((decision, index) => (
                  <li key={index}>{decision}</li>
                ))}
              </ul>
            </div>
          )}
          {analysis.questions && analysis.questions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Open Questions
              </h4>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                {analysis.questions.map((question, index) => (
                  <li key={index}>{question}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </AccordionSection>

      {/* Thread Analysis */}
      <AccordionSection title="Thread Analysis" icon={Users}>
        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Conversation Flow
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {analysis.conversationFlow}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {threadEmails.length} email{threadEmails.length !== 1 ? 's' : ''}{' '}
              in thread
              {threadEmails.length > 0 &&
                ` • Started ${formatDistanceToNow(
                  new Date(
                    threadEmails[0].sentAt || threadEmails[0].receivedAt
                  ),
                  { addSuffix: true }
                )}`}
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Participants
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.participants.map((participant, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                >
                  {participant}
                </span>
              ))}
            </div>
          </div>
        </div>
      </AccordionSection>

      {/* Related Emails */}
      <AccordionSection title="Thread Emails" icon={Link2}>
        <div className="space-y-2">
          {threadEmails.map((email) => (
            <div
              key={email.id}
              className="p-2 rounded-md bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {email.subject}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                From:{' '}
                {email.fromAddress?.name ||
                  email.fromAddress?.email ||
                  email.fromAddress}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(
                  new Date(email.sentAt || email.receivedAt),
                  { addSuffix: true }
                )}
              </p>
            </div>
          ))}
        </div>
      </AccordionSection>

      {/* Action Items */}
      {analysis.actionItems && analysis.actionItems.length > 0 && (
        <AccordionSection title="Action Items" icon={CheckSquare}>
          <div className="space-y-2">
            {analysis.actionItems.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {item.task}
                  </p>
                  {item.dueDate && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Due: {item.dueDate}
                    </p>
                  )}
                  <span
                    className={cn(
                      'text-xs font-medium',
                      getPriorityColor(item.priority)
                    )}
                  >
                    {item.priority.charAt(0).toUpperCase() +
                      item.priority.slice(1)}{' '}
                    Priority
                  </span>
                </div>
              </div>
            ))}
          </div>
        </AccordionSection>
      )}

      {/* Attachments Summary */}
      {threadAttachments.length > 0 && (
        <AccordionSection title="Attachments" icon={Paperclip}>
          <div className="space-y-2">
            {threadAttachments
              .slice(0, 10)
              .map((attachment: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-md bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
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
            {threadAttachments.length > 10 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                +{threadAttachments.length - 10} more attachments
              </p>
            )}
          </div>
        </AccordionSection>
      )}
    </div>
  );
}
