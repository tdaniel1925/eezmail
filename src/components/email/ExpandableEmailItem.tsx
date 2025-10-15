'use client';

import { useState } from 'react';
import {
  ChevronDown,
  Trash2,
  Archive,
  Clock,
  Reply,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AISummaryBox } from './AISummaryBox';
import { AIAnalysisModal } from './AIAnalysisModal';
import { ContextualActions } from './ContextualActions';
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
  const [isRead, setIsRead] = useState(email.isRead ?? false);
  const [showAIModal, setShowAIModal] = useState(false);

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

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const senderName =
    email.fromAddress?.name || email.fromAddress?.email || 'Unknown';
  const initials = getSenderInitials(senderName);
  const timeAgo = getTimeAgo(email.sentAt || email.createdAt);

  return (
    <div
      className={cn(
        'px-6 py-2 border-b transition-all duration-200 cursor-pointer',
        'bg-[var(--bg-secondary)] border-[var(--border-color)]',
        !isRead && 'bg-[var(--unread-bg)]',
        isExpanded && 'bg-[var(--active-bg)]',
        'hover:bg-[var(--item-hover)]',
        className
      )}
      onClick={handleToggle}
    >
      {/* Compact 2-Line Layout */}
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div className="w-7 h-7 mt-0.5 rounded-lg bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-blue-dark)] flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
          {initials}
        </div>

        {/* Email Info */}
        <div className="flex-1 min-w-0">
          {/* Line 1: Sender + AI Icon + Time */}
          <div className="flex items-baseline gap-2 mb-0.5">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'text-sm truncate transition-colors',
                  !isRead ? 'font-semibold' : 'font-medium'
                )}
                style={{ color: 'var(--text-primary)' }}
              >
                {senderName}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAIModal(true);
                }}
                className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors group"
                title="AI Analysis"
              >
                <Sparkles
                  size={14}
                  className="text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300"
                />
              </button>
            </div>
            <span
              className="text-xs flex-shrink-0 transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {timeAgo}
            </span>
          </div>

          {/* Line 2: Subject + Preview (compact) */}
          <div className="flex items-center gap-1.5 text-sm truncate">
            <span
              className={cn(
                'flex-shrink-0 transition-colors max-w-xs truncate',
                !isRead ? 'font-semibold' : 'font-normal'
              )}
              style={{ color: 'var(--text-primary)' }}
            >
              {email.subject || '(No subject)'}
            </span>
            {!isExpanded && email.snippet && (
              <>
                <span
                  className="text-xs"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  —
                </span>
                <span
                  className="flex-1 truncate text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {email.snippet}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Unread + Expand */}
        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
          {!isRead && (
            <div className="w-2 h-2 rounded-full bg-[var(--accent-blue)]" />
          )}
          <ChevronDown
            size={16}
            className={cn(
              'transition-all duration-200',
              'text-[var(--text-tertiary)]',
              isExpanded && 'rotate-180 text-[var(--accent-blue)]'
            )}
          />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div
          className="mt-3 pt-3 border-t transition-all duration-200 ml-9.5"
          style={{ borderColor: 'var(--border-color)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Action Buttons - Compact */}
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => handleAction('reply')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: 'var(--accent-blue)',
                color: 'white',
              }}
            >
              <Reply className="h-3.5 w-3.5" />
              Reply
            </button>
            <button
              type="button"
              onClick={() => handleAction('archive')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              <Archive className="h-3.5 w-3.5" />
              Archive
            </button>
            <button
              type="button"
              onClick={() => handleAction('snooze')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              <Clock className="h-3.5 w-3.5" />
              Snooze
            </button>
            <button
              type="button"
              onClick={() => handleAction('delete')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ml-auto"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-red)',
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>

          {/* AI Summary */}
          {email.aiSummary && (
            <div className="mb-3">
              <AISummaryBox
                summary={email.aiSummary}
                quickReplies={email.aiQuickReplies}
              />
            </div>
          )}

          {/* Contextual Actions */}
          <ContextualActions email={email} />

          {/* Full Email Body - Compact */}
          <div
            className="p-3 rounded-lg border"
            style={{
              background: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
            }}
          >
            {/* Header */}
            <div
              className="mb-3 pb-3 border-b"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-start gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-blue-dark)] flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-semibold text-sm mb-0.5 truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {senderName}
                  </div>
                  <div
                    className="text-xs truncate"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {email.fromAddress?.email}
                  </div>
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {new Date(email.sentAt || email.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <div
                className="font-semibold text-sm"
                style={{ color: 'var(--text-primary)' }}
              >
                {email.subject}
              </div>
            </div>

            {/* Body */}
            <div
              className="prose prose-sm max-w-none text-sm leading-relaxed"
              style={{ color: 'var(--text-primary)' }}
              dangerouslySetInnerHTML={{
                __html:
                  email.bodyHtml ||
                  email.bodyText ||
                  email.snippet ||
                  'No content',
              }}
            />

            {/* Attachments */}
            {email.hasAttachments && (
              <div
                className="mt-3 pt-3 border-t"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <div
                  className="text-xs font-medium mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  📎 ATTACHMENTS
                </div>
                <p className="text-xs text-gray-500">
                  This email has attachments
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Analysis Modal */}
      <AIAnalysisModal
        email={email}
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
      />
    </div>
  );
}
