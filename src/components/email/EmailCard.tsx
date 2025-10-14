'use client';

import { useState } from 'react';
import { Star, Paperclip, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Email } from '@/db/schema';
import { format, isToday, isYesterday } from 'date-fns';

interface EmailCardProps {
  email: Email;
  isSelected?: boolean;
  onClick?: () => void;
}

export function EmailCard({
  email,
  isSelected = false,
  onClick,
}: EmailCardProps): JSX.Element {
  const [isStarred, setIsStarred] = useState(email.isStarred);

  const handleStarClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setIsStarred(!isStarred);
    // TODO: Update star status in database
  };

  const formatTime = (date: Date): string => {
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  // Determine sender display
  const senderName = email.fromAddress.name || email.fromAddress.email;
  const senderEmail = email.fromAddress.email;
  const displaySender =
    senderName !== senderEmail ? senderName : email.fromAddress.email;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative cursor-pointer rounded-lg border transition-all',
        // Unread styling
        !email.isRead && 'border-l-4 border-l-primary',
        // Selected styling
        isSelected
          ? 'border-2 border-primary bg-primary/5 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-950 dark:hover:border-gray-700',
        // Read vs Unread background
        email.isRead
          ? 'bg-gray-50 dark:bg-gray-900'
          : 'bg-white dark:bg-gray-950'
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Star Icon */}
        <button
          type="button"
          onClick={handleStarClick}
          className={cn(
            'mt-0.5 flex-shrink-0 transition-colors',
            isStarred
              ? 'text-starred'
              : 'text-gray-300 hover:text-gray-400 dark:text-gray-700 dark:hover:text-gray-600'
          )}
          aria-label={isStarred ? 'Unstar email' : 'Star email'}
        >
          <Star className={cn('h-5 w-5', isStarred && 'fill-current')} />
        </button>

        {/* Email Content */}
        <div className="flex-1 min-w-0">
          {/* First Line: Sender + Time */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span
              className={cn(
                'truncate text-sm',
                !email.isRead
                  ? 'font-semibold text-gray-900 dark:text-gray-100'
                  : 'font-medium text-gray-700 dark:text-gray-300'
              )}
            >
              {displaySender}
            </span>
            <span className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
              {formatTime(new Date(email.receivedAt))}
            </span>
          </div>

          {/* Second Line: Subject */}
          <div
            className={cn(
              'mb-1 truncate text-sm',
              !email.isRead
                ? 'font-semibold text-gray-900 dark:text-gray-100'
                : 'font-normal text-gray-700 dark:text-gray-300'
            )}
          >
            {email.subject || '(No subject)'}
          </div>

          {/* Third Line: Snippet + Badges */}
          <div className="flex items-center justify-between gap-2">
            <p className="line-clamp-2 flex-1 text-xs text-gray-600 dark:text-gray-400">
              {email.snippet || email.bodyText?.substring(0, 150) || ''}
            </p>
            <div className="flex flex-shrink-0 items-center gap-1">
              {email.hasAttachments && (
                <Paperclip className="h-4 w-4 text-gray-400" />
              )}
              {email.replyLaterUntil && (
                <Clock className="h-4 w-4 text-orange-500" />
              )}
            </div>
          </div>

          {/* Hey View Badge */}
          {email.heyView && (
            <div className="mt-2">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  email.heyView === 'imbox' &&
                    'bg-imbox-gold/10 text-imbox-gold',
                  email.heyView === 'feed' &&
                    'bg-feed-green/10 text-feed-green',
                  email.heyView === 'paper_trail' &&
                    'bg-paper-blue/10 text-paper-blue'
                )}
              >
                {email.heyView === 'imbox' && '✨ Imbox'}
                {email.heyView === 'feed' && '📰 Feed'}
                {email.heyView === 'paper_trail' && '🧾 Paper Trail'}
              </span>
            </div>
          )}

          {/* AI Priority Badge */}
          {email.aiPriority === 'urgent' && (
            <div className="mt-2">
              <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/20 dark:text-red-400">
                🔥 Urgent
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Unread Indicator */}
      {!email.isRead && (
        <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-primary" />
      )}
    </div>
  );
}
