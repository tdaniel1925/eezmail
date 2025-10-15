'use client';

import { useState } from 'react';
import {
  Star,
  Paperclip,
  ChevronDown,
  ChevronUp,
  Archive,
  Flag,
  Trash2,
  MoreVertical,
  Clock,
  Reply,
  Forward,
  FileIcon,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Email } from '@/db/schema';

interface ExpandableEmailCardProps {
  email: Email;
  isExpanded: boolean;
  onToggle: () => void;
  onOpenAIActions?: () => void;
}

export function ExpandableEmailCard({
  email,
  isExpanded,
  onToggle,
  onOpenAIActions,
}: ExpandableEmailCardProps): JSX.Element {
  const [isStarred, setIsStarred] = useState(email.isStarred || false);

  // Generate initials from sender name
  const getInitials = (name: string | undefined | null): string => {
    if (!name) {
      return '??'; // Default initials for unknown sender
    }

    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate consistent color from email
  const getColorFromEmail = (email: string | undefined | null): string => {
    const colors = [
      'bg-purple-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-red-500',
    ];

    // Handle null/undefined email
    if (!email) {
      return colors[0]; // Default to first color
    }

    const hash = email
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const senderName =
    email.fromAddress?.name || email.fromAddress?.email || 'Unknown Sender';
  const senderEmail = email.fromAddress?.email;
  const hasAttachments = email.hasAttachments;

  return (
    <div
      className={cn(
        'border-b border-gray-200 dark:border-gray-800 transition-all duration-200',
        isExpanded
          ? 'bg-gray-50 dark:bg-gray-900/50'
          : 'hover:bg-gray-50 dark:hover:bg-gray-900/30'
      )}
    >
      {/* Email Preview */}
      <div onClick={onToggle} className="p-3 cursor-pointer">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0',
              getColorFromEmail(senderEmail)
            )}
          >
            {getInitials(senderName)}
          </div>

          {/* Email Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3
                    className={cn(
                      'text-sm text-gray-800 dark:text-white',
                      !email.isRead ? 'font-bold' : 'font-semibold'
                    )}
                  >
                    {senderName}
                  </h3>
                  {onOpenAIActions && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAIActions();
                      }}
                      className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded transition-colors group"
                      title="AI Actions"
                      aria-label="Open AI Actions"
                    >
                      <Sparkles
                        size={12}
                        className="text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300"
                      />
                    </button>
                  )}
                  {!email.isRead && (
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {senderEmail}
                </p>
              </div>

              <div className="flex items-center gap-2 ml-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(email.receivedAt).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
                <div className="flex items-center gap-1.5">
                  {isStarred && (
                    <Star
                      size={14}
                      className="text-yellow-500 fill-yellow-500"
                    />
                  )}
                  {hasAttachments && (
                    <Paperclip size={14} className="text-gray-400" />
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </div>
            </div>

            <p
              className={cn(
                'text-sm text-gray-900 dark:text-gray-100 mb-1',
                !email.isRead ? 'font-semibold' : ''
              )}
            >
              {email.subject}
            </p>

            {!isExpanded && (
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                {email.snippet}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Email Content */}
      {isExpanded && (
        <div className="px-3 pb-3">
          <div className="flex gap-3">
            {/* Spacer for avatar alignment */}
            <div className="w-8 flex-shrink-0"></div>

            {/* Expanded content */}
            <div className="flex-1 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
              {/* Email Actions */}
              <div className="flex items-center gap-1.5 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <button
                  className="p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded transition-colors border border-gray-200 dark:border-gray-700"
                  aria-label="Archive"
                >
                  <Archive
                    size={14}
                    className="text-gray-600 dark:text-gray-400"
                  />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsStarred(!isStarred);
                  }}
                  className="p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded transition-colors border border-gray-200 dark:border-gray-700"
                  aria-label="Star"
                >
                  <Star
                    size={14}
                    className={cn(
                      isStarred
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-600 dark:text-gray-400'
                    )}
                  />
                </button>
                <button
                  className="p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded transition-colors border border-gray-200 dark:border-gray-700"
                  aria-label="Flag"
                >
                  <Flag
                    size={14}
                    className="text-gray-600 dark:text-gray-400"
                  />
                </button>
                <button
                  className="p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded transition-colors border border-gray-200 dark:border-gray-700"
                  aria-label="Delete"
                >
                  <Trash2
                    size={14}
                    className="text-gray-600 dark:text-gray-400"
                  />
                </button>
                <button
                  className="p-1.5 hover:bg-white dark:hover:bg-gray-800 rounded transition-colors border border-gray-200 dark:border-gray-700"
                  aria-label="More"
                >
                  <MoreVertical
                    size={14}
                    className="text-gray-600 dark:text-gray-400"
                  />
                </button>
                <div className="flex items-center gap-1.5 ml-auto text-xs text-gray-500 dark:text-gray-400">
                  <Clock size={12} />
                  <span>{new Date(email.receivedAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Email Body */}
              <div className="prose dark:prose-invert prose-sm max-w-none mb-4">
                <div
                  className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html:
                      email.bodyHtml || email.bodyText || email.snippet || '',
                  }}
                />
              </div>

              {/* Attachments */}
              {hasAttachments && (
                <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Paperclip size={16} />
                    Attachments
                  </p>
                  <div className="space-y-2">
                    {/* TODO: Render actual attachments when data is available */}
                    {[].map((attachment: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <FileIcon
                            size={20}
                            className="text-blue-600 dark:text-blue-400"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {attachment.filename || 'document.pdf'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {attachment.size || '2.4 MB'}
                          </p>
                        </div>
                        <button className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply Actions */}
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200">
                  <Reply size={14} />
                  Reply
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors">
                  <Forward size={14} />
                  Forward
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
