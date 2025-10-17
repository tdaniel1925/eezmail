'use client';

import {
  Reply,
  Archive,
  Clock,
  Trash2,
  MoreHorizontal,
  Star,
  Tag,
  Forward,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { Email } from '@/db/schema';

interface QuickActionsProps {
  email: Email | null;
  onReply?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onSnooze?: () => void;
}

export function QuickActions({
  email,
  onReply,
  onArchive,
  onDelete,
  onSnooze,
}: QuickActionsProps): JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      toast.info('Reply action triggered');
    }
  };

  const handleArchive = () => {
    if (onArchive) {
      onArchive();
    } else {
      toast.success('Email archived');
    }
  };

  const handleSnooze = () => {
    if (onSnooze) {
      onSnooze();
    } else {
      toast.info('Snooze action triggered');
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    } else {
      toast.success('Email deleted');
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
          icon={<Archive className="h-4 w-4" />}
          label="Archive"
          onClick={handleArchive}
        />
        <ActionButton
          icon={<Clock className="h-4 w-4" />}
          label="Snooze"
          onClick={handleSnooze}
        />
        <ActionButton
          icon={<Trash2 className="h-4 w-4" />}
          label="Delete"
          onClick={handleDelete}
          variant="danger"
        />
      </div>

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
      className={`flex flex-col items-center space-y-1 rounded-md border py-3 transition-colors ${variantClasses}`}
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
