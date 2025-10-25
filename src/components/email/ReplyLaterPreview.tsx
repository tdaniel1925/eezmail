'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, ExternalLink, X, Loader2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import type { Email } from '@/db/schema';
import { toast } from 'sonner';

interface ReplyLaterPreviewProps {
  email: Email;
  onClose: () => void;
  onSend: (replyContent: string) => Promise<void>;
  onOpenFull: () => void;
}

export function ReplyLaterPreview({
  email,
  onClose,
  onSend,
  onOpenFull,
}: ReplyLaterPreviewProps): JSX.Element {
  const [draftContent, setDraftContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate AI draft on mount
  useEffect(() => {
    async function generateDraft() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/reply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject: email.subject,
            bodyText: email.bodyText,
            bodyHtml: email.bodyHtml,
            senderName: email.fromAddress.name || email.fromAddress.email?.split('@')[0] || 'there',
            senderEmail: email.fromAddress.email,
            isDraft: true,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate draft');
        }

        const data = await response.json();

        if (data.success && data.reply) {
          setDraftContent(data.reply);
        } else {
          throw new Error(data.error || 'Failed to generate reply');
        }
      } catch (err) {
        console.error('Error generating draft:', err);
        setError('Failed to generate AI draft. Please try again.');
        setDraftContent(''); // Empty draft for manual editing
      } finally {
        setIsLoading(false);
      }
    }

    generateDraft();
  }, [email]);

  const handleSend = async () => {
    if (!draftContent.trim()) {
      toast.error('Reply content cannot be empty');
      return;
    }

    setIsSending(true);
    try {
      await onSend(draftContent);
      toast.success('Reply sent successfully!');
    } catch (err) {
      console.error('Error sending reply:', err);
      toast.error('Failed to send reply. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const senderName = email.fromAddress.name || email.fromAddress.email;
  const isOverdue = email.replyLaterUntil
    ? new Date(email.replyLaterUntil) < new Date()
    : false;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Preview Modal */}
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        className="fixed bottom-24 left-1/2 z-50 w-[600px] max-w-[90vw] -translate-x-1/2"
      >
        {/* Arrow pointing down */}
        <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white dark:bg-gray-800" />

        <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {senderName}
                </h3>
                {isOverdue && (
                  <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    <Clock className="h-3 w-3" />
                    Overdue
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {email.fromAddress.email}
              </p>
              <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Re: {email.subject}
              </p>
              {email.replyLaterUntil && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Reply by: {format(new Date(email.replyLaterUntil), 'PPp')}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Email Snippet */}
          <div className="border-b border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
            <p className="text-sm italic text-gray-600 dark:text-gray-400">
              "{email.snippet?.substring(0, 150)}..."
            </p>
          </div>

          {/* Draft Reply */}
          <div className="p-4">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              AI-Generated Draft Reply
            </label>

            {isLoading ? (
              <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-900">
                <div className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    AI is drafting your reply...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                <textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  placeholder="Write your reply manually..."
                  className="mt-2 w-full resize-none rounded-lg border border-red-300 bg-white p-3 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-red-900 dark:bg-gray-800 dark:text-white"
                  rows={8}
                />
              </div>
            ) : (
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                className="w-full resize-none rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                rows={8}
                placeholder="Edit your reply..."
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
            <button
              onClick={onOpenFull}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ExternalLink className="h-4 w-4" />
              Open Full View
            </button>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Dismiss
              </button>
              <button
                onClick={handleSend}
                disabled={isSending || !draftContent.trim()}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Reply
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

