'use client';

import {
  Reply,
  Users,
  Clock,
  Trash2,
  MoreHorizontal,
  Star,
  Tag,
  Forward,
  Sparkles,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { addHours, addDays } from 'date-fns';
import { useReplyLater } from '@/contexts/ReplyLaterContext';
import { ContextualActions } from '@/components/email/ContextualActions';
import type { Email } from '@/db/schema';

interface QuickActionsProps {
  email: Email | null;
  onReply?: () => void;
  onReplyAll?: () => void;
  onDelete?: () => void;
  onSnooze?: () => void;
}

export function QuickActions({
  email,
  onReply,
  onReplyAll,
  onDelete,
  onSnooze,
}: QuickActionsProps): JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showReplyLaterPicker, setShowReplyLaterPicker] = useState(false);
  const [showAIActions, setShowAIActions] = useState(false);
  const [showCustomDateTime, setShowCustomDateTime] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');
  const replyLaterRef = useRef<HTMLDivElement>(null);
  const { addEmail } = useReplyLater();

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

  if (!email) {
    return (
      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Select an email to see actions
      </div>
    );
  }

  const handleReply = () => {
    if (onReply) {
      onReply();
    } else {
      // Dispatch event to open email composer in reply mode
      window.dispatchEvent(new CustomEvent('open-composer', {
        detail: { mode: 'reply', email }
      }));
      toast.success('Opening reply composer...');
    }
  };

  const handleReplyAll = () => {
    if (onReplyAll) {
      onReplyAll();
    } else {
      // Dispatch event to open email composer in reply-all mode
      window.dispatchEvent(new CustomEvent('open-composer', {
        detail: { mode: 'reply-all', email }
      }));
      toast.success('Opening reply-all composer...');
    }
  };

  const handleReplyLater = async (date: Date) => {
    setShowReplyLaterPicker(false);
    setShowCustomDateTime(false);
    if (email) {
      await addEmail(email.id, date);
    }
  };

  const handleCustomDateTime = () => {
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

  const handleSnooze = () => {
    if (onSnooze) {
      onSnooze();
    } else {
      toast.info('Snooze action triggered');
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      onDelete();
    } else {
      if (!email) return;
      
      toast.loading('Deleting email...', { id: 'delete' });
      
      try {
        const response = await fetch('/api/email/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailId: email.id }),
        });

        if (!response.ok) throw new Error('Failed to delete email');
        
        toast.success('Email deleted', { id: 'delete' });
        
        // Refresh email list and close viewer
        window.dispatchEvent(new CustomEvent('refresh-email-list'));
        window.dispatchEvent(new CustomEvent('close-email-viewer'));
      } catch (error) {
        console.error('Error deleting email:', error);
        toast.error('Failed to delete email', { id: 'delete' });
      }
    }
  };

  return (
    <div className="space-y-2 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Quick Actions
      </h3>

      <div className="grid grid-cols-2 gap-2">
        <ActionButton
          icon={<Reply className="h-4 w-4" />}
          label="Reply"
          onClick={handleReply}
        />
        <ActionButton
          icon={<Users className="h-4 w-4" />}
          label="Reply All"
          onClick={handleReplyAll}
        />
        <div className="relative w-full h-full" ref={replyLaterRef}>
          <ActionButton
            icon={<Clock className="h-4 w-4" />}
            label="Reply Later"
            onClick={() => setShowReplyLaterPicker(!showReplyLaterPicker)}
          />

          {/* Reply Later Date Picker */}
          {showReplyLaterPicker && (
            <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-800">
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
        <ActionButton
          icon={<Trash2 className="h-4 w-4" />}
          label="Delete"
          onClick={handleDelete}
          variant="danger"
        />
      </div>

      {/* AI Contextual Actions */}
      <button
        onClick={() => setShowAIActions(!showAIActions)}
        className="flex w-full items-center justify-center space-x-2 rounded-md border border-blue-200 bg-blue-50 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
      >
        <Sparkles className="h-4 w-4" />
        <span>AI Actions</span>
      </button>

      {showAIActions && email && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
          <ContextualActions email={email} />
        </div>
      )}

      {/* More Actions */}
      <div className="relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex w-full items-center justify-center space-x-2 rounded-md border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span>More Actions</span>
        </button>

        {isMenuOpen && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="py-1">
              <MoreActionItem
                icon={<Star className="h-4 w-4" />}
                label="Star"
                onClick={() => {
                  toast.info('Starred');
                  setIsMenuOpen(false);
                }}
              />
              <MoreActionItem
                icon={<Tag className="h-4 w-4" />}
                label="Add Label"
                onClick={() => {
                  toast.info('Label action');
                  setIsMenuOpen(false);
                }}
              />
              <MoreActionItem
                icon={<Forward className="h-4 w-4" />}
                label="Forward"
                onClick={() => {
                  toast.info('Forward action');
                  setIsMenuOpen(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

function ActionButton({
  icon,
  label,
  onClick,
  variant = 'default',
}: ActionButtonProps): JSX.Element {
  const variantClasses =
    variant === 'danger'
      ? 'border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20'
      : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800';

  return (
    <button
      onClick={onClick}
      className={`flex w-full h-full flex-col items-center space-y-1 rounded-md border py-3 transition-colors ${variantClasses}`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

interface MoreActionItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function MoreActionItem({
  icon,
  label,
  onClick,
}: MoreActionItemProps): JSX.Element {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
