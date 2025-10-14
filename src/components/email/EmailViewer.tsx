'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Archive,
  Trash2,
  Reply,
  Forward,
  MoreVertical,
  Star,
  Clock,
  Paperclip,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Email } from '@/db/schema';
import { format } from 'date-fns';

interface EmailViewerProps {
  email: Email | null;
  onClose?: () => void;
}

export function EmailViewer({ email, onClose }: EmailViewerProps): JSX.Element {
  const [isStarred, setIsStarred] = useState(email?.isStarred ?? false);

  if (!email) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-4xl">📧</div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            No email selected
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select an email to view its contents
          </p>
        </div>
      </div>
    );
  }

  const handleStarClick = (): void => {
    setIsStarred(!isStarred);
    // TODO: Update star status
  };

  const senderName = email.fromAddress.name || email.fromAddress.email;

  return (
    <div className="flex h-full flex-col">
      {/* Action Bar */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            aria-label="Back to list"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={handleStarClick}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
            isStarred
              ? 'text-starred hover:bg-starred/10'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
          )}
          aria-label={isStarred ? 'Unstar' : 'Star'}
        >
          <Star className={cn('h-4 w-4', isStarred && 'fill-current')} />
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          aria-label="Archive"
        >
          <Archive className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          aria-label="Reply later"
        >
          <Clock className="h-4 w-4" />
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="flex h-8 px-3 items-center justify-center gap-2 rounded-lg bg-primary text-white transition-colors hover:bg-primary/90"
          >
            <Reply className="h-4 w-4" />
            <span className="text-sm font-medium">Reply</span>
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            aria-label="More options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-gray-950">
          <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {email.subject || '(No subject)'}
          </h1>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-600 text-white">
                <span className="text-sm font-semibold">
                  {senderName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {senderName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {email.fromAddress.email}
                </p>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                  To: {email.toAddresses.map((addr) => addr.email).join(', ')}
                  {email.ccAddresses && email.ccAddresses.length > 0 && (
                    <span className="ml-1">
                      • Cc:{' '}
                      {email.ccAddresses.map((addr) => addr.email).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {format(new Date(email.receivedAt), 'MMM d, yyyy')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {format(new Date(email.receivedAt), 'h:mm a')}
              </p>
            </div>
          </div>

          {/* Attachments */}
          {email.hasAttachments && (
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Paperclip className="h-4 w-4" />
                <span>2 attachments</span>
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    document.pdf (2.3 MB)
                  </span>
                  <button
                    type="button"
                    className="text-primary hover:text-primary-600"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Badge */}
          {email.trackersBlocked && email.trackersBlocked > 0 && (
            <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-900/20">
              <p className="text-xs font-medium text-green-700 dark:text-green-400">
                🛡️ {email.trackersBlocked} tracker
                {email.trackersBlocked !== 1 ? 's' : ''} blocked
              </p>
            </div>
          )}
        </div>

        {/* Email Body */}
        <div className="bg-white px-6 py-6 dark:bg-gray-950">
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html:
                email.bodyHtml ||
                email.bodyText?.replace(/\n/g, '<br />') ||
                '',
            }}
          />
        </div>

        {/* AI Summary (if available) */}
        {email.aiSummary && (
          <div className="border-t border-gray-200 bg-blue-50 px-6 py-4 dark:border-gray-800 dark:bg-blue-900/10">
            <div className="flex items-start gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <span className="text-xs">🤖</span>
              </div>
              <div className="flex-1">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  AI Summary
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {email.aiSummary}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Reply Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              <Reply className="h-4 w-4" />
              Reply
            </button>
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Forward className="h-4 w-4" />
              Forward
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
