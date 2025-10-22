'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckSquare,
  Mail,
  Loader2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThreadMessage {
  id: string;
  subject: string;
  from: {
    name?: string;
    email: string;
  };
  to: string[];
  cc?: string[];
  bodyText: string;
  bodyHtml?: string;
  receivedAt: string;
  isRead: boolean;
}

interface ActionItem {
  task: string;
  assignee?: string;
  deadline?: string;
  status: 'pending' | 'completed';
}

interface ThreadSummary {
  summary: string;
  keyPoints: string[];
  actionItems: ActionItem[];
}

interface ThreadTimelineProps {
  threadId: string;
  onClose: () => void;
}

export function ThreadTimeline({ threadId, onClose }: ThreadTimelineProps) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [summary, setSummary] = useState<ThreadSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchThreadData();
  }, [threadId]);

  const fetchThreadData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/threads/${threadId}/summary`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error('Error fetching thread:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMessage = (id: string) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedMessages(newExpanded);
  };

  const getInitials = (name?: string, email?: string): string => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  const getAvatarColor = (email: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-orange-500',
    ];
    const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const formatDate = (date: string): string => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return `Today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    return d.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="p-12 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Analyzing conversation...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-600" />
              Conversation Timeline
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {messages.length} messages in this thread
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* AI Summary */}
          {summary && (
            <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI Summary
                </h3>
              </div>

              <p className="text-gray-800 dark:text-gray-200 leading-relaxed mb-4">
                {summary.summary}
              </p>

              {summary.keyPoints.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Key Points:
                  </h4>
                  <ul className="space-y-1">
                    {summary.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.actionItems.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Action Items:
                  </h4>
                  <div className="space-y-2">
                    {summary.actionItems.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 rounded-lg bg-white/50 dark:bg-gray-800/50 p-3"
                      >
                        <input
                          type="checkbox"
                          checked={item.status === 'completed'}
                          readOnly
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-800 dark:text-gray-200">
                            {item.task}
                          </p>
                          {(item.assignee || item.deadline) && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {item.assignee && `Assigned to: ${item.assignee}`}
                              {item.assignee && item.deadline && ' • '}
                              {item.deadline && `Due: ${item.deadline}`}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Timeline */}
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-[29px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500" />

            {/* Messages */}
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative pl-16"
                  >
                    {/* Avatar */}
                    <div
                      className={`absolute left-0 top-0 flex items-center justify-center w-[58px] h-[58px] rounded-full border-4 border-white dark:border-gray-900 ${getAvatarColor(message.from.email)}`}
                    >
                      <span className="text-lg font-bold text-white">
                        {getInitials(message.from.name, message.from.email)}
                      </span>
                    </div>

                    {/* Message Card */}
                    <Card className="hover:shadow-lg transition-shadow">
                      <div className="p-4">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {message.from.name || message.from.email}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {message.from.email}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(message.receivedAt)}</span>
                            </div>
                            {!message.isRead && (
                              <Badge className="mt-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Preview */}
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          {message.bodyText}
                        </p>

                        {/* Expand/Collapse */}
                        <button
                          onClick={() => toggleMessage(message.id)}
                          className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {expandedMessages.has(message.id) ? (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              <span>Show less</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" />
                              <span>Read full message</span>
                            </>
                          )}
                        </button>

                        {/* Expanded Content */}
                        <AnimatePresence>
                          {expandedMessages.has(message.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                            >
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                {message.bodyHtml ? (
                                  <div dangerouslySetInnerHTML={{ __html: message.bodyHtml }} />
                                ) : (
                                  <p className="whitespace-pre-wrap">{message.bodyText}</p>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}


