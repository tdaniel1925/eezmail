'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  Trash2,
  Archive,
  Clock,
  Reply,
  Sparkles,
  Forward,
  CheckSquare,
  Square,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { addHours, addDays } from 'date-fns';
import { useReplyLater } from '@/contexts/ReplyLaterContext';
import { toast } from 'sonner';
import { AISummaryBox } from './AISummaryBox';
import { AIAnalysisModal } from './AIAnalysisModal';
import { ContextualActions } from './ContextualActions';
import { ThreadBadge } from './ThreadBadge';
import { ThreadTimelineModal } from './ThreadTimelineModal';
import { getThreadCount } from '@/lib/email/thread-actions';
import { useChatbotContext } from '@/components/ai/ChatbotContext';
import type { Email } from '@/db/schema';
import { motion, AnimatePresence } from 'framer-motion';

interface ExpandableEmailItemProps {
  email: Email;
  isExpanded?: boolean;
  isSelected?: boolean;
  onToggle?: () => void;
  onSelect?: () => void;
  onAction?: (action: string, emailId: string) => void;
  onNavigateToEmail?: (emailId: string) => void;
  className?: string;
}

export function ExpandableEmailItem({
  email,
  isExpanded = false,
  isSelected = false,
  onToggle,
  onSelect,
  onAction,
  onNavigateToEmail,
  className,
}: ExpandableEmailItemProps): JSX.Element {
  const { setCurrentEmail } = useChatbotContext();
  const { addEmail } = useReplyLater();
  const [isRead, setIsRead] = useState(email.isRead ?? false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showThreadModal, setShowThreadModal] = useState(false);
  const [threadCount, setThreadCount] = useState<number>(0);
  const [showReplyLaterPicker, setShowReplyLaterPicker] = useState(false);
  const [showCustomDateTime, setShowCustomDateTime] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');
  const replyLaterRef = useRef<HTMLDivElement>(null);

  // AI Summary Hover State
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch thread count if email has a threadId
  useEffect(() => {
    if (email.threadId) {
      getThreadCount(email.threadId).then((result) => {
        if (result.success && result.count) {
          setThreadCount(result.count);
        }
      });
    }
  }, [email.threadId]);

  // Set current email context when expanded
  useEffect(() => {
    if (isExpanded) {
      setCurrentEmail(email);
    } else {
      setCurrentEmail(null);
    }
  }, [isExpanded, email, setCurrentEmail]);

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        replyLaterRef.current &&
        !replyLaterRef.current.contains(event.target as Node)
      ) {
        setShowReplyLaterPicker(false);
      }
    }

    if (showReplyLaterPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showReplyLaterPicker]);

  const handleToggle = (): void => {
    if (!isRead) {
      setIsRead(true);
    }
    onToggle?.();
  };

  const handleAction = (action: string): void => {
    onAction?.(action, email.id);
  };

  const handleReplyLater = async (date: Date): Promise<void> => {
    setShowReplyLaterPicker(false);
    setShowCustomDateTime(false);
    await addEmail(email.id, date);
  };

  const handleCustomDateTime = (): void => {
    if (!customDate || !customTime) {
      toast.error('Please select both date and time');
      return;
    }

    const selectedDateTime = new Date(`${customDate}T${customTime}`);
    const now = new Date();

    if (selectedDateTime <= now) {
      toast.error('Please select a future date and time');
      return;
    }

    handleReplyLater(selectedDateTime);
    setCustomDate('');
    setCustomTime('');
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

  // AI Summary Hover Functions
  const fetchSummary = async (): Promise<void> => {
    if (summary || isLoadingSummary || isExpanded) return;

    setIsLoadingSummary(true);
    setSummaryError(false);

    try {
      console.log('🔍 Fetching AI summary for email:', email.id);

      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId: email.id }),
      });

      console.log('📡 API Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch summary');
      }

      const data = await response.json();
      console.log('✅ API Response Data:', data);

      if (data.success && data.summary) {
        setSummary(data.summary);
        console.log('✅ Summary set successfully');
      } else {
        console.error('❌ No summary in response:', data);
        setSummaryError(true);
      }
    } catch (error) {
      console.error('❌ Error fetching summary:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      setSummaryError(true);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const calculatePopupPosition = (mouseX: number, mouseY: number): void => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const popupWidth = 320;
    const popupHeight = 200;
    const aiSidebarWidth = 380; // Approximate AI sidebar width when expanded

    // Position 15 pixels to the right of cursor
    let finalLeft = mouseX + 15;

    // Vertically center on cursor
    let finalTop = mouseY - popupHeight / 2;

    console.log('🎯 Popup Calculation:', {
      cursor: { x: mouseX, y: mouseY },
      initialLeft: finalLeft,
      initialTop: finalTop,
      viewport: { width: viewportWidth, height: viewportHeight },
    });

    // Check if popup would overlap with AI sidebar (on right side of screen)
    const rightEdgeOfPopup = finalLeft + popupWidth;
    const aiSidebarStartsAt = viewportWidth - aiSidebarWidth;

    // If popup would overlap with AI sidebar, show on left of cursor instead
    if (rightEdgeOfPopup > aiSidebarStartsAt - 20) {
      finalLeft = mouseX - popupWidth - 15;
      console.log(
        '📍 Adjusted left (would overlap AI sidebar, showing on left):',
        finalLeft
      );
    }

    // If showing on right but would go off viewport edge, show on left
    if (finalLeft + popupWidth > viewportWidth - 20 && finalLeft > mouseX) {
      finalLeft = mouseX - popupWidth - 15;
      console.log('📍 Adjusted left (showing on left of cursor):', finalLeft);
    }

    // Ensure doesn't go off left edge
    if (finalLeft < 20) {
      finalLeft = 20;
      console.log('📍 Clamped to left edge:', finalLeft);
    }

    // PRIORITY: Ensure popup stays in viewport vertically (overrides centering)
    if (finalTop + popupHeight > viewportHeight - 20) {
      // Would go off bottom, adjust to fit
      finalTop = viewportHeight - popupHeight - 20;
      console.log('📍 Adjusted top (near bottom):', finalTop);
    }

    if (finalTop < 20) {
      // Would go off top, adjust to fit
      finalTop = 20;
      console.log('📍 Adjusted top (near top):', finalTop);
    }

    console.log('✅ Final Position:', { top: finalTop, left: finalLeft });
    setPopupPosition({ top: finalTop, left: finalLeft });
  };

  const handleMouseEnter = (event: React.MouseEvent): void => {
    if (isExpanded) return;

    // Track cursor position
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    setCursorPosition({ x: mouseX, y: mouseY });

    console.log('🖱️ Mouse Enter:', { x: mouseX, y: mouseY });

    hoverTimeoutRef.current = setTimeout(() => {
      calculatePopupPosition(mouseX, mouseY);
      setShowSummary(true);
      fetchSummary();
    }, 200);
  };

  const handleMouseMove = (event: React.MouseEvent): void => {
    if (isExpanded) return;

    // Update cursor position while hovering (in case user moves mouse)
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    setCursorPosition({ x: mouseX, y: mouseY });

    // Recalculate position if summary is already showing
    if (showSummary) {
      calculatePopupPosition(mouseX, mouseY);
    }
  };

  const handleMouseLeave = (): void => {
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

  const senderName =
    email.fromAddress?.name || email.fromAddress?.email || 'Unknown';
  const initials = getSenderInitials(senderName);
  const timeAgo = getTimeAgo(email.sentAt || email.createdAt);

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'px-6 py-3 border-b transition-all duration-200 cursor-pointer',
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
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
          className="flex items-center justify-center p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={isSelected ? 'Deselect' : 'Select'}
        >
          {isSelected ? (
            <CheckSquare className="h-4 w-4 text-blue-600" />
          ) : (
            <Square className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {/* Avatar */}
        <div className="w-7 h-7 mt-0.5 rounded-lg bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-blue-dark)] flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
          {initials}
        </div>

        {/* Email Info */}
        <div className="flex-1 min-w-0">
          {/* Line 1: Sender + AI Icon + Thread Badge + Time */}
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
              {threadCount > 1 && (
                <ThreadBadge
                  count={threadCount}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowThreadModal(true);
                  }}
                />
              )}
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
            <div className="relative" ref={replyLaterRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReplyLaterPicker(!showReplyLaterPicker);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                <Clock className="h-3.5 w-3.5" />
                Reply Later
              </button>

              {/* Reply Later Date Picker */}
              {showReplyLaterPicker && (
                <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-lg border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                  <p className="mb-2 px-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                    Reply Later
                  </p>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleReplyLater(addHours(new Date(), 2))}
                      className="w-full rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      In 2 hours
                    </button>
                    <button
                      onClick={() => handleReplyLater(addHours(new Date(), 4))}
                      className="w-full rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      In 4 hours
                    </button>
                    <button
                      onClick={() => handleReplyLater(addDays(new Date(), 1))}
                      className="w-full rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Tomorrow
                    </button>
                    <button
                      onClick={() => handleReplyLater(addDays(new Date(), 2))}
                      className="w-full rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      In 2 days
                    </button>
                    <button
                      onClick={() => handleReplyLater(addDays(new Date(), 7))}
                      className="w-full rounded px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Next week
                    </button>
                    <div className="my-1.5 border-t border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={() => setShowCustomDateTime(!showCustomDateTime)}
                      className="w-full rounded px-2 py-1.5 text-left text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    >
                      Custom date & time...
                    </button>

                    {/* Custom Date/Time Inputs */}
                    {showCustomDateTime && (
                      <div className="mt-1.5 space-y-1.5 rounded-md bg-gray-50 p-2 dark:bg-gray-900">
                        <div>
                          <label className="mb-0.5 block text-xs text-gray-600 dark:text-gray-400">
                            Date
                          </label>
                          <input
                            type="date"
                            value={customDate}
                            onChange={(e) => setCustomDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="mb-0.5 block text-xs text-gray-600 dark:text-gray-400">
                            Time
                          </label>
                          <input
                            type="time"
                            value={customTime}
                            onChange={(e) => setCustomTime(e.target.value)}
                            className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          />
                        </div>
                        <button
                          onClick={handleCustomDateTime}
                          className="w-full rounded bg-blue-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Set Reply Later
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
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
              onClick={() => handleAction('forward')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              <Forward className="h-3.5 w-3.5" />
              Forward
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
          <div className="mb-4">
            <ContextualActions email={email} />
          </div>

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

      {/* Thread Timeline Modal */}
      {email.threadId && (
        <ThreadTimelineModal
          isOpen={showThreadModal}
          onClose={() => setShowThreadModal(false)}
          threadId={email.threadId}
          threadSubject={email.subject || 'Thread Timeline'}
          onNavigateToEmail={onNavigateToEmail}
        />
      )}

      {/* AI Summary Hover Popup - Rendered via Portal */}
      {typeof window !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {showSummary && !isExpanded && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'fixed',
                  top: '40%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 99999,
                  width: '420px',
                  maxWidth: '90vw',
                  pointerEvents: 'none', // Prevent interfering with mouse events
                }}
                className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-blue-500/30 rounded-lg shadow-2xl p-4"
              >
                {/* Header */}
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    AI Summary
                  </h3>
                </div>

                {/* Content */}
                <div className="min-h-[80px]">
                  {isLoadingSummary && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        Generating summary...
                      </span>
                    </div>
                  )}

                  {summaryError && !isLoadingSummary && (
                    <div className="text-sm py-4">
                      <p className="text-red-600 dark:text-red-400 mb-2">
                        ❌ Failed to generate summary
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Check console for details. Possible causes:
                      </p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-4 list-disc">
                        <li>OpenAI API key not configured</li>
                        <li>Network connection issue</li>
                        <li>Email content too short</li>
                      </ul>
                    </div>
                  )}

                  {summary && !isLoadingSummary && (
                    <>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                        {summary}
                      </p>
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          💡 Click email for full details
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
