'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Mail,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimelineEmail {
  id: string;
  subject: string;
  from: { email: string; name: string };
  to: Array<{ email: string; name: string }>;
  receivedAt: Date;
  snippet: string;
  isRead: boolean;
}

interface ActionItem {
  task: string;
  assignee?: string;
  deadline?: string;
  completed: boolean;
}

interface ThreadSummary {
  summary: string;
  keyPoints: string[];
  actionItems: ActionItem[];
  participants: string[];
  timeline: Array<{
    date: string;
    sender: string;
    mainPoint: string;
  }>;
}

interface ConversationTimelineProps {
  threadId: string;
  emails: TimelineEmail[];
  onClose: () => void;
}

export function ConversationTimeline({
  threadId,
  emails: initialEmails,
  onClose,
}: ConversationTimelineProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<ThreadSummary | null>(null);
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchThreadSummary();
  }, [threadId]);

  const fetchThreadSummary = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/summarize-thread', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ threadId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate thread summary');
      }

      const data = await response.json();
      setSummary(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching thread summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEmail = (emailId: string) => {
    setExpandedEmails((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  const sortedEmails = [...initialEmails].sort(
    (a, b) =>
      new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              Conversation Timeline
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {sortedEmails.length} message
              {sortedEmails.length !== 1 ? 's' : ''} in thread
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* AI Summary Section */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                Generating AI summary...
              </span>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          ) : (
            summary && (
              <div className="mb-6 space-y-4">
                {/* Summary Card */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      AI Summary
                    </h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {summary.summary}
                  </p>
                </div>

                {/* Key Points */}
                {summary.keyPoints.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Key Points
                    </h4>
                    <ul className="space-y-2">
                      {summary.keyPoints.map((point, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                        >
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Items */}
                {summary.actionItems.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      Action Items
                    </h4>
                    <ul className="space-y-3">
                      {summary.actionItems.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-gray-700 dark:text-gray-300"
                        >
                          <input
                            type="checkbox"
                            checked={item.completed}
                            readOnly
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p
                              className={
                                item.completed ? 'line-through opacity-60' : ''
                              }
                            >
                              {item.task}
                            </p>
                            {(item.assignee || item.deadline) && (
                              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {item.assignee && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {item.assignee}
                                  </span>
                                )}
                                {item.deadline && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {item.deadline}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          )}

          {/* Timeline */}
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

            {/* Timeline Items */}
            <div className="space-y-6">
              {sortedEmails.map((email, index) => (
                <div key={email.id} className="relative pl-12">
                  {/* Timeline Dot */}
                  <div
                    className={cn(
                      'absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-900',
                      email.isRead
                        ? 'bg-gray-400 dark:bg-gray-600'
                        : 'bg-primary'
                    )}
                  >
                    <Mail className="h-4 w-4 text-white" />
                  </div>

                  {/* Email Card */}
                  <div
                    className={cn(
                      'bg-white dark:bg-gray-800 rounded-lg border cursor-pointer transition-all',
                      expandedEmails.has(email.id)
                        ? 'border-primary shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                    onClick={() => toggleEmail(email.id)}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 dark:text-white truncate">
                              {email.from.name || email.from.email}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {format(
                                new Date(email.receivedAt),
                                'MMM d, h:mm a'
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            To:{' '}
                            {email.to.map((t) => t.name || t.email).join(', ')}
                          </p>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {expandedEmails.has(email.id) && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {email.snippet}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
