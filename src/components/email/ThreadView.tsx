'use client';

import { useEffect, useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Email, EmailThread } from '@/db/schema';

interface ThreadViewProps {
  threadId: string;
  emails: Email[];
  threadSummary?: string;
}

export function ThreadView({
  threadId,
  emails,
  threadSummary,
}: ThreadViewProps): JSX.Element {
  const [expandedEmailIds, setExpandedEmailIds] = useState<Set<string>>(
    new Set()
  );

  // Get initials from name
  const getInitials = (name: string): string => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Format time ago
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const toggleEmail = (emailId: string): void => {
    setExpandedEmailIds((prev) => {
      const next = new Set(prev);
      if (next.has(emailId)) {
        next.delete(emailId);
      } else {
        next.add(emailId);
      }
      return next;
    });
  };

  // Sort emails by date
  const sortedEmails = [...emails].sort(
    (a, b) =>
      new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
  );

  const participants = Array.from(
    new Set(
      sortedEmails.flatMap((e) => [
        e.fromAddress?.email,
        ...((e.toAddresses as any[])?.map((t) => t.email) || []),
      ])
    )
  ).filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Thread Header */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {sortedEmails[0]?.subject || 'Thread'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {sortedEmails.length} messages • {participants.length}{' '}
              participants
            </p>
          </div>
        </div>

        {/* AI Thread Summary */}
        {threadSummary && (
          <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                  AI Summary
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {threadSummary}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Thread Timeline */}
      <div className="space-y-4">
        {sortedEmails.map((email, index) => {
          const isExpanded = expandedEmailIds.has(email.id);
          const senderName =
            email.fromAddress?.name || email.fromAddress?.email || 'Unknown';
          const initials = getInitials(senderName);

          return (
            <div key={email.id} className="flex gap-4">
              {/* Timeline Line */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0',
                    'bg-gradient-to-br from-blue-500 to-purple-600'
                  )}
                >
                  {initials}
                </div>
                {index < sortedEmails.length - 1 && (
                  <div className="w-0.5 bg-gray-300 dark:bg-gray-700 flex-1 mt-2 min-h-[30px]"></div>
                )}
              </div>

              {/* Email Content */}
              <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden">
                {/* Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  onClick={() => toggleEmail(email.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {senderName}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {email.fromAddress?.email}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTimeAgo(email.receivedAt)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Preview when collapsed */}
                  {!isExpanded && (
                    <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {email.snippet || email.bodyText?.substring(0, 100)}
                    </div>
                  )}
                </div>

                {/* Expanded Body */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-200 dark:border-white/10">
                    <div className="mt-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {email.bodyText || 'No content'}
                    </div>

                    {/* Attachments */}
                    {email.hasAttachments && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          📎 Attachments
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
