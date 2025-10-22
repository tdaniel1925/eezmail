'use client';

import { useState, useRef, useEffect } from 'react';
import { Star, Paperclip, Clock, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Email } from '@/db/schema';
import { format, isToday, isYesterday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface EmailCardWithSummaryProps {
  email: Email;
  isSelected?: boolean;
  onClick?: () => void;
}

export function EmailCardWithSummary({
  email,
  isSelected = false,
  onClick,
}: EmailCardWithSummaryProps): JSX.Element {
  const [isStarred, setIsStarred] = useState(email.isStarred);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  const cardRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Fetch AI summary
  const fetchSummary = async (): Promise<void> => {
    if (summary || isLoadingSummary) return; // Don't refetch if already loaded or loading

    setIsLoadingSummary(true);
    setSummaryError(false);

    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId: email.id }),
      });

      if (!response.ok) throw new Error('Failed to fetch summary');

      const data = await response.json();
      if (data.success && data.summary) {
        setSummary(data.summary);
      } else {
        setSummaryError(true);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
      setSummaryError(true);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Calculate popup position
  const calculatePopupPosition = (): void => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Position popup to the right of the card
    const left = rect.right + 16; // 16px gap from card
    const top = rect.top;

    // Check if popup would go off screen (assume popup width ~320px, height ~200px)
    const popupWidth = 320;
    const popupHeight = 200;

    let finalLeft = left;
    let finalTop = top;

    // If popup would go off right edge, show on left side instead
    if (left + popupWidth > viewportWidth - 20) {
      finalLeft = rect.left - popupWidth - 16;
    }

    // Adjust vertical position if it would go off screen
    if (top + popupHeight > viewportHeight - 20) {
      finalTop = viewportHeight - popupHeight - 20;
    }

    setPopupPosition({ top: finalTop, left: finalLeft });
  };

  // Handle mouse enter with delay
  const handleMouseEnter = (): void => {
    // Add a small delay before showing summary (500ms)
    hoverTimeoutRef.current = setTimeout(() => {
      setShowSummary(true);
      calculatePopupPosition();
      fetchSummary();
    }, 500);
  };

  // Handle mouse leave
  const handleMouseLeave = (): void => {
    // Clear the timeout if user leaves before delay completes
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setShowSummary(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Determine sender display
  const senderName = email.fromAddress.name || email.fromAddress.email;
  const senderEmail = email.fromAddress.email;
  const displaySender =
    senderName !== senderEmail ? senderName : email.fromAddress.email;

  return (
    <>
      <div
        ref={cardRef}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          'group relative cursor-pointer rounded-lg border transition-all duration-300',
          // Glass morphism base
          'border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md ring-1 ring-gray-300 dark:ring-white/10',
          // Hover states
          'hover:bg-gray-100/80 dark:hover:bg-white/[0.07] hover:border-gray-300 dark:hover:border-white/20 hover:ring-gray-400 dark:hover:ring-white/20',
          'hover:scale-[1.01] hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]',
          // Selected state
          isSelected &&
            'bg-blue-50/80 dark:bg-white/10 border-primary/50 dark:border-primary/30 ring-primary/30 dark:ring-primary/20',
          // Unread indicator
          !email.isRead && 'border-l-2 border-l-primary'
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
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60'
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
                    ? 'font-semibold text-gray-900 dark:text-white'
                    : 'font-medium text-gray-700 dark:text-white/80'
                )}
              >
                {displaySender}
              </span>
              <span className="flex-shrink-0 text-xs text-gray-600 dark:text-white/50">
                {formatTime(new Date(email.receivedAt))}
              </span>
            </div>

            {/* Second Line: Subject */}
            <div
              className={cn(
                'mb-1 truncate text-sm',
                !email.isRead
                  ? 'font-semibold text-gray-900 dark:text-white'
                  : 'font-normal text-gray-700 dark:text-white/70'
              )}
            >
              {email.subject || '(No subject)'}
            </div>

            {/* Third Line: Snippet + Badges */}
            <div className="flex items-center justify-between gap-2">
              <p className="line-clamp-2 flex-1 text-xs text-gray-600 dark:text-white/50">
                {email.snippet || email.bodyText?.substring(0, 150) || ''}
              </p>
              <div className="flex flex-shrink-0 items-center gap-1">
                {email.hasAttachments && (
                  <Paperclip className="h-4 w-4 text-gray-500 dark:text-white/40" />
                )}
                {email.replyLaterUntil && (
                  <Clock className="h-4 w-4 text-orange-400" />
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
                  {email.heyView === 'imbox' && '✨ Inbox'}
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

      {/* AI Summary Popup */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: `${popupPosition.top}px`,
              left: `${popupPosition.left}px`,
              zIndex: 9999,
            }}
            className="pointer-events-none w-80"
            onMouseEnter={() => setShowSummary(true)}
          >
            <div className="rounded-lg border-2 border-blue-500/30 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg shadow-2xl p-4">
              {/* Header */}
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  AI Summary
                </span>
              </div>

              {/* Content */}
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {isLoadingSummary ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-xs text-gray-500">
                      Generating summary...
                    </span>
                  </div>
                ) : summaryError ? (
                  <div className="py-2 text-xs text-red-500">
                    Failed to generate summary. Please try again.
                  </div>
                ) : summary ? (
                  <p className="leading-relaxed">{summary}</p>
                ) : (
                  <div className="py-2 text-xs text-gray-500">
                    No summary available.
                  </div>
                )}
              </div>

              {/* Footer hint */}
              {!isLoadingSummary && summary && (
                <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    💡 Click email for full details
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


