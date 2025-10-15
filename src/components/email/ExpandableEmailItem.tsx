'use client';

import { useState } from 'react';
import { ChevronDown, Trash2, Archive, Clock, Reply } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AISummaryBox } from './AISummaryBox';
import type { Email } from '@/db/schema';

interface ExpandableEmailItemProps {
  email: Email;
  isExpanded?: boolean;
  onToggle?: () => void;
  onAction?: (action: string, emailId: string) => void;
  className?: string;
}

export function ExpandableEmailItem({
  email,
  isExpanded = false,
  onToggle,
  onAction,
  className,
}: ExpandableEmailItemProps): JSX.Element {
  const [isRead, setIsRead] = useState(!email.unread);

  const handleToggle = (): void => {
    if (!isRead) {
      setIsRead(true);
    }
    onToggle?.();
  };

  const handleAction = (action: string): void => {
    onAction?.(action, email.id);
  };

  // Get sender initials for avatar
  const getSenderInitials = (name: string): string => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Format time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const senderName = email.fromAddress?.name || email.fromAddress?.email || 'Unknown';
  const initials = getSenderInitials(senderName);
  const timeAgo = getTimeAgo(email.sentAt || email.createdAt);

  return (
    <div
      className={cn(
        'px-8 py-5 border-b transition-all duration-300 cursor-pointer',
        'bg-[var(--bg-secondary)] border-[var(--border-color)]',
        !isRead && 'bg-[var(--unread-bg)]',
        isExpanded && 'bg-[var(--active-bg)]',
        'hover:bg-[var(--item-hover)]',
        className
      )}
      onClick={handleToggle}
    >
      {/* Email Item Header */}
      <div className="flex items-start justify-between gap-5">
        <div className="flex-1 min-w-0">
          {/* Top Row: Avatar + Sender + Time */}
          <div className="flex items-center gap-3 mb-2">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-blue-dark)] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {initials}
            </div>

            {/* Sender Info */}
            <div className="flex-1 min-w-0">
              <div
                className="font-semibold text-[15px] mb-0.5 transition-colors duration-300"
                style={{ color: 'var(--text-primary)' }}
              >
                {senderName}
              </div>
              <div
                className="text-[13px] transition-colors duration-300"
                style={{ color: 'var(--text-secondary)' }}
              >
                {timeAgo}
              </div>
            </div>
          </div>

          {/* Subject */}
          <div
            className="text-base font-semibold mb-1.5 transition-colors duration-300"
            style={{ color: 'var(--text-primary)' }}
          >
            {email.subject}
          </div>

          {/* Preview */}
          <div
            className="text-sm leading-relaxed line-clamp-2 transition-colors duration-300"
            style={{ color: 'var(--text-secondary)' }}
          >
            {email.snippet || email.body?.substring(0, 150)}
          </div>

          {/* Tags */}
          {(email.isImportant || email.hasAttachments) && (
            <div className="flex gap-1.5 mt-2.5 flex-wrap">
              {email.isImportant && (
                <span className="text-[11px] px-2.5 py-1 rounded-md font-medium bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                  Important
                </span>
              )}
              {email.hasAttachments && (
                <span className="text-[11px] px-2.5 py-1 rounded-md font-medium bg-blue-50 text-blue-800 dark:bg-[#1e3a5f] dark:text-[#93c5fd]">
                  AI Ready
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Unread Indicator + Expand Icon */}
        <div className="flex items-center gap-3">
          {!isRead && (
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-blue)]" />
          )}
          <ChevronDown
            size={20}
            className={cn(
              'transition-all duration-300',
              'text-[var(--text-secondary)]',
              isExpanded && 'rotate-180 text-[var(--accent-blue)]'
            )}
          />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div
          className="mt-4 pt-6 border-t transition-all duration-300"
          style={{ borderColor: 'var(--border-color)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pl-[52px]">
            {/* Action Buttons */}
            <div className="flex gap-2 mb-6 pb-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <button
                onClick={() => handleAction('delete')}
                className={cn(
                  'px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200',
                  'bg-[var(--bg-secondary)] border-[var(--border-color)]',
                  'text-[var(--text-primary)]',
                  'hover:bg-[var(--item-hover)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]',
                  'flex items-center gap-2'
                )}
              >
                <Trash2 size={16} />
                Delete
              </button>
              <button
                onClick={() => handleAction('archive')}
                className={cn(
                  'px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200',
                  'bg-[var(--bg-secondary)] border-[var(--border-color)]',
                  'text-[var(--text-primary)]',
                  'hover:bg-[var(--item-hover)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]',
                  'flex items-center gap-2'
                )}
              >
                <Archive size={16} />
                Archive
              </button>
              <button
                onClick={() => handleAction('reply-later')}
                className={cn(
                  'px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200',
                  'bg-[var(--bg-secondary)] border-[var(--border-color)]',
                  'text-[var(--text-primary)]',
                  'hover:bg-[var(--item-hover)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]',
                  'flex items-center gap-2'
                )}
              >
                <Clock size={16} />
                Reply Later
              </button>
              <button
                onClick={() => handleAction('reply')}
                className={cn(
                  'px-4 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200',
                  'bg-[var(--accent-blue)] border-[var(--accent-blue)]',
                  'text-white',
                  'hover:bg-[var(--accent-blue-hover)]',
                  'flex items-center gap-2'
                )}
              >
                <Reply size={16} />
                Reply
              </button>
            </div>

            {/* AI Summary */}
            {email.isImportant && (
              <AISummaryBox
                summary="This email contains important information about Q4 campaign results. The sender reports strong performance with increased engagement and conversion rates, and recommends budget adjustments for next quarter."
                quickReplies={[
                  '👍 Great work! Let\'s meet Tuesday at 2pm',
                  '📊 Can you send the full report?',
                  '💰 Approved for budget increase',
                ]}
                onQuickReply={(reply) => handleAction(`quick-reply: ${reply}`)}
                className="mb-7"
              />
            )}

            {/* Email Body */}
            <div
              className="text-[15px] leading-relaxed mb-7 transition-colors duration-300"
              style={{ color: 'var(--text-primary)', lineHeight: '1.8' }}
            >
              <div dangerouslySetInnerHTML={{ __html: email.body || email.snippet || 'No content' }} />
            </div>

            {/* Attachments */}
            {email.hasAttachments && email.attachments && email.attachments.length > 0 && (
              <div className="mt-7 pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <div
                  className="text-[13px] font-semibold mb-3 transition-colors duration-300"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  📎 {email.attachments.length} ATTACHMENT{email.attachments.length > 1 ? 'S' : ''}
                </div>
                <div className="space-y-2">
                  {email.attachments.map((attachment: any, index: number) => (
                    <div
                      key={index}
                      className={cn(
                        'flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all duration-200',
                        'bg-[var(--bg-secondary)] border-[var(--border-color)]',
                        'hover:bg-[var(--item-hover)] hover:border-[var(--accent-blue)]'
                      )}
                    >
                      <div className="w-11 h-11 bg-[var(--accent-blue)] rounded-lg flex items-center justify-center text-white text-xl flex-shrink-0">
                        📄
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-medium mb-0.5 transition-colors duration-300"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {attachment.filename || 'Attachment'}
                        </div>
                        <div
                          className="text-xs transition-colors duration-300"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

