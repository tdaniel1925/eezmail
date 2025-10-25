'use client';

import { Mail, Reply, Forward, Archive, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailResultCardProps {
  email: any;
  onOpen?: (id: string) => void;
  onReply?: (id: string) => void;
  onForward?: (id: string) => void;
  onArchive?: (id: string) => void;
}

export function EmailResultCard({
  email,
  onOpen,
  onReply,
  onForward,
  onArchive,
}: EmailResultCardProps) {
  const handleOpen = () => {
    if (onOpen) {
      onOpen(email.id);
    } else {
      // Fallback: navigate to email in inbox
      window.location.href = `/dashboard/inbox?emailId=${email.id}`;
    }
  };

  const fromName =
    typeof email.fromAddress === 'string'
      ? email.fromAddress
      : email.fromAddress?.name || email.fromAddress?.email || 'Unknown';

  const date = email.receivedAt
    ? new Date(email.receivedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div
      className={cn(
        'group relative rounded-lg border-2 border-gray-200 bg-white p-4',
        'transition-all duration-200 hover:border-primary hover:shadow-md',
        'cursor-pointer dark:border-gray-700 dark:bg-gray-800',
        !email.isRead && 'bg-blue-50/50 dark:bg-blue-900/10'
      )}
      onClick={handleOpen}
    >
      {/* Unread indicator */}
      {!email.isRead && (
        <div className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary" />
      )}

      {/* Header */}
      <div className="mb-2 flex items-start justify-between gap-3 pl-4">
        <div className="min-w-0 flex-1">
          <h4
            className={cn(
              'truncate text-sm',
              !email.isRead
                ? 'font-semibold text-gray-900 dark:text-white'
                : 'font-medium text-gray-700 dark:text-gray-300'
            )}
          >
            {email.subject || '(No subject)'}
          </h4>
          <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">{fromName}</span>
            {date && <span className="ml-2">• {date}</span>}
          </p>
        </div>

        {/* Email icon */}
        <Mail className="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-primary" />
      </div>

      {/* Preview */}
      {email.bodyPreview && (
        <p className="mb-3 line-clamp-2 pl-4 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
          {email.bodyPreview}
        </p>
      )}

      {/* Attachments indicator */}
      {email.hasAttachments && (
        <div className="mb-3 flex items-center gap-1 pl-4 text-xs text-gray-500 dark:text-gray-400">
          <svg
            className="h-3 w-3"
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

      {/* Quick actions */}
      <div className="flex items-center gap-1 border-t border-gray-200 pt-3 dark:border-gray-700">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpen();
          }}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          title="Open email"
        >
          <ExternalLink className="h-3 w-3" />
          Open
        </button>

        {onReply && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReply(email.id);
            }}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
            title="Reply"
          >
            <Reply className="h-3 w-3" />
            Reply
          </button>
        )}

        {onForward && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onForward(email.id);
            }}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-green-50 hover:text-green-700 dark:text-gray-300 dark:hover:bg-green-900/20 dark:hover:text-green-400"
            title="Forward"
          >
            <Forward className="h-3 w-3" />
            Forward
          </button>
        )}

        {onArchive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchive(email.id);
            }}
            className="ml-auto flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            title="Archive"
          >
            <Archive className="h-3 w-3" />
            Archive
          </button>
        )}
      </div>
    </div>
  );
}
