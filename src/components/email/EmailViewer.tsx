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
      <div className="flex h-full items-center justify-center bg-black/50">
        <div className="text-center">
          <div className="mb-2 text-4xl">📧</div>
          <p className="text-lg font-medium text-white/80">
            No email selected
          </p>
          <p className="text-sm text-white/50">
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
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 backdrop-blur-md px-4 py-3">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white"
            aria-label="Back to list"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={handleStarClick}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200',
            isStarred
              ? 'text-amber-400 hover:bg-amber-400/10'
              : 'text-white/70 hover:bg-white/10 hover:text-white'
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
            className="flex h-8 px-3 items-center justify-center gap-2 rounded-lg bg-white/10 border border-white/20 text-white transition-all duration-200 hover:bg-white/15 hover:border-white/30"
          >
            <Reply className="h-4 w-4" />
            <span className="text-sm font-medium">Reply</span>
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white"
            aria-label="More options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-white/10 bg-white/5 backdrop-blur-md px-6 py-6">
          <h1 className="mb-4 text-2xl font-bold text-white">
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
                <p className="font-medium text-white">
                  {senderName}
                </p>
                <p className="text-sm text-white/70">
                  {email.fromAddress.email}
                </p>
                <div className="mt-1 text-xs text-white/50">
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
              <p className="text-sm text-white/70">
                {format(new Date(email.receivedAt), 'MMM d, yyyy')}
              </p>
              <p className="text-xs text-white/50">
                {format(new Date(email.receivedAt), 'h:mm a')}
              </p>
            </div>
          </div>

          {/* Attachments */}
          {email.hasAttachments && (
            <div className="mt-4 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-white/80">
                <Paperclip className="h-4 w-4" />
                <span>2 attachments</span>
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between rounded p-2 hover:bg-white/10 transition-colors duration-200">
                  <span className="text-sm text-white/70">
                    document.pdf (2.3 MB)
                  </span>
                  <button
                    type="button"
                    className="text-white/70 hover:text-white transition-colors duration-200"
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
        <div className="bg-black/30 px-6 py-6">
          <div
            className="prose prose-sm max-w-none prose-invert text-white/80"
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
          <div className="border-t border-white/10 bg-blue-500/10 backdrop-blur-md px-6 py-4">
            <div className="flex items-start gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20">
                <span className="text-xs">🤖</span>
              </div>
              <div className="flex-1">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-400">
                  AI Summary
                </p>
                <p className="text-sm text-white/80">
                  {email.aiSummary}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Reply Footer */}
        <div className="border-t border-white/10 bg-white/5 backdrop-blur-md px-6 py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-lg bg-white/10 border border-white/20 px-4 text-sm font-medium text-white transition-all duration-200 hover:bg-white/15 hover:border-white/30"
            >
              <Reply className="h-4 w-4" />
              Reply
            </button>
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-medium text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white"
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
