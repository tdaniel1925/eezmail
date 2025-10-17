'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, ExternalLink, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getThreadEmails } from '@/lib/email/thread-actions';
import { formatDistanceToNow } from 'date-fns';
import type { Email } from '@/db/schema';

interface ThreadTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  threadId: string;
  threadSubject: string;
  onNavigateToEmail?: (emailId: string) => void;
}

export function ThreadTimelineModal({
  isOpen,
  onClose,
  threadId,
  threadSubject,
  onNavigateToEmail,
}: ThreadTimelineModalProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);

  // Handle client-side mounting for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Fetch thread emails when modal opens
  useEffect(() => {
    if (isOpen && threadId) {
      loadThreadEmails();
    }
  }, [isOpen, threadId]);

  const loadThreadEmails = async () => {
    setIsLoading(true);
    setError(null);

    const result = await getThreadEmails(threadId);

    if (result.success && result.emails) {
      setEmails(result.emails);
    } else {
      setError(result.error || 'Failed to load thread emails');
    }

    setIsLoading(false);
  };

  const handleEmailClick = (emailId: string) => {
    setExpandedEmailId(expandedEmailId === emailId ? null : emailId);
  };

  const getInitials = (fromAddress: any) => {
    if (typeof fromAddress === 'string') {
      return fromAddress.substring(0, 2).toUpperCase();
    }
    if (fromAddress?.name) {
      const names = fromAddress.name.split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return fromAddress.name.substring(0, 2).toUpperCase();
    }
    if (fromAddress?.email) {
      return fromAddress.email.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  const getSenderName = (fromAddress: any) => {
    if (typeof fromAddress === 'string') {
      return fromAddress;
    }
    return fromAddress?.name || fromAddress?.email || 'Unknown';
  };

  const getSenderEmail = (fromAddress: any) => {
    if (typeof fromAddress === 'string') {
      return fromAddress;
    }
    return fromAddress?.email || '';
  };

  const formatTimestamp = (date: Date | string | null) => {
    if (!date) return 'Unknown date';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    try {
      return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch {
      return 'Invalid date';
    }
  };

  const truncateSnippet = (text: string | null, maxLength: number = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-3xl max-h-[85vh] pointer-events-auto"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MessageCircle size={20} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {threadSubject || 'Thread Timeline'}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {emails.length}{' '}
                        {emails.length === 1 ? 'message' : 'messages'} in
                        conversation
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 ml-2"
                  >
                    <X size={18} className="text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <p className="text-red-600 dark:text-red-400 text-center">
                        {error}
                      </p>
                    </div>
                  ) : emails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <MessageCircle
                        size={48}
                        className="text-gray-300 dark:text-gray-600 mb-3"
                      />
                      <p className="text-gray-500 dark:text-gray-400 text-center">
                        No emails found in this thread
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Timeline Line */}
                      <div className="absolute left-[21px] top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

                      {/* Timeline Items */}
                      <div className="space-y-6">
                        {emails.map((email, index) => (
                          <motion.div
                            key={email.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="relative pl-12"
                          >
                            {/* Avatar */}
                            <div className="absolute left-0 top-0 w-[42px] h-[42px] rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold border-4 border-white dark:border-gray-800 z-10">
                              {getInitials(email.fromAddress)}
                            </div>

                            {/* Email Accordion Card */}
                            <div className="w-full bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-transparent transition-all duration-200">
                              {/* Clickable Header */}
                              <button
                                onClick={() => handleEmailClick(email.id)}
                                className="w-full text-left p-4 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg transition-colors group"
                              >
                                {/* Header */}
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-gray-900 dark:text-white">
                                        {getSenderName(email.fromAddress)}
                                      </span>
                                      {email.isRead && (
                                        <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-[10px] font-medium rounded">
                                          Read
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {getSenderEmail(email.fromAddress)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatTimestamp(email.sentAt)}
                                    </span>
                                    <motion.div
                                      animate={{
                                        rotate:
                                          expandedEmailId === email.id
                                            ? 180
                                            : 0,
                                      }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <svg
                                        className="w-4 h-4 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 9l-7 7-7-7"
                                        />
                                      </svg>
                                    </motion.div>
                                  </div>
                                </div>

                                {/* Subject (if different from thread) */}
                                {email.subject &&
                                  email.subject !== threadSubject && (
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                      {email.subject}
                                    </p>
                                  )}

                                {/* Email Preview (when collapsed) */}
                                {expandedEmailId !== email.id && (
                                  <div className="mt-2">
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                      <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                                        Preview • Click to read full email
                                      </span>
                                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">
                                        {email.snippet ||
                                          'No preview available'}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Attachments indicator */}
                                {email.hasAttachments &&
                                  expandedEmailId !== email.id && (
                                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                      <svg
                                        className="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                        />
                                      </svg>
                                      <span>Has attachments</span>
                                    </div>
                                  )}
                              </button>

                              {/* Expanded Email Content */}
                              <AnimatePresence>
                                {expandedEmailId === email.id && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-4 pb-4 space-y-3">
                                      {/* Divider */}
                                      <div className="border-t border-gray-200 dark:border-gray-700" />

                                      {/* Header: Full Email Label */}
                                      <div className="flex items-center gap-2 px-2">
                                        <svg
                                          className="w-4 h-4 text-gray-500 dark:text-gray-400"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                          />
                                        </svg>
                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                          Full Email
                                        </span>
                                      </div>

                                      {/* Full Email Subject */}
                                      {email.subject && (
                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                            Subject
                                          </p>
                                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {email.subject}
                                          </p>
                                        </div>
                                      )}

                                      {/* Email Body */}
                                      <div>
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-2">
                                          Message
                                        </p>
                                        <div
                                          className="prose prose-sm dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto shadow-sm"
                                          dangerouslySetInnerHTML={{
                                            __html:
                                              email.bodyHtml ||
                                              email.bodyText?.replace(
                                                /\n/g,
                                                '<br>'
                                              ) ||
                                              email.snippet ||
                                              'No content',
                                          }}
                                        />
                                      </div>

                                      {/* Attachments */}
                                      {email.hasAttachments && (
                                        <div>
                                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-2">
                                            Attachments
                                          </p>
                                          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 text-sm">
                                            <svg
                                              className="w-4 h-4 text-amber-600 dark:text-amber-400"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                              />
                                            </svg>
                                            <span className="text-amber-900 dark:text-amber-100">
                                              This email has attachments
                                            </span>
                                          </div>
                                        </div>
                                      )}

                                      {/* View in Main List Button */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onNavigateToEmail?.(email.id);
                                          onClose();
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                      >
                                        <ExternalLink size={14} />
                                        <span>View in inbox</span>
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Click any email to expand and read the full message
                  </p>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
