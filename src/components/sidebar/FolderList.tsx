'use client';

import { useState, useEffect } from 'react';
import {
  Inbox,
  Reply,
  Newspaper,
  Send,
  FileText,
  Clock,
  Bell,
  Mail,
  AlertOctagon,
  Trash2,
  Archive,
  Check,
  Settings,
  Filter,
  Paperclip,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebarStore } from '@/stores/sidebarStore';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  markFolderAsRead,
  emptyFolder as emptyFolderAction,
} from '@/lib/folders/actions';
import { createClient } from '@/lib/supabase/client';

interface FolderListProps {
  isCollapsed?: boolean;
}

export function FolderList({ isCollapsed = false }: FolderListProps) {
  const { activeFolder, setActiveFolder, unreadCounts } = useSidebarStore();
  const router = useRouter();
  const [contextMenuFolder, setContextMenuFolder] = useState<string | null>(
    null
  );
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID on mount
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  const primaryFolders = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: unreadCounts.inbox },
    {
      id: 'newsfeed',
      label: 'News Feed',
      icon: Newspaper,
      count: unreadCounts.newsFeed,
    },
    { id: 'sent', label: 'Sent', icon: Send, count: unreadCounts.sent },
    {
      id: 'drafts',
      label: 'Drafts',
      icon: FileText,
      count: unreadCounts.drafts,
    },
    {
      id: 'attachments',
      label: 'Attachments',
      icon: Paperclip,
      count: 0,
    },
  ];

  const standardFolders = [
    {
      id: 'all',
      label: 'Unified Inbox',
      icon: Mail,
      count: unreadCounts.unifiedInbox,
    },
    { id: 'spam', label: 'Spam', icon: AlertOctagon, count: unreadCounts.spam },
    { id: 'trash', label: 'Trash', icon: Trash2, count: unreadCounts.trash },
    {
      id: 'archived',
      label: 'Archive',
      icon: Archive,
      count: unreadCounts.archive,
    },
  ];

  const handleFolderClick = (folderId: string) => {
    setActiveFolder(folderId);
    // Navigate to the folder view
    if (typeof window !== 'undefined') {
      window.location.href = `/dashboard/${folderId}`;
    }
  };

  const handleContextMenu = (e: React.MouseEvent, folderId: string) => {
    e.preventDefault();
    setContextMenuFolder(folderId);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMarkAllRead = async (folderId: string) => {
    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const result = await markFolderAsRead({
        userId,
        folder: folderId,
      });

      if (result.success) {
        toast.success(result.message);
        // Trigger refresh
        window.dispatchEvent(new CustomEvent('refresh-email-list'));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Mark all read error:', error);
      toast.error('Failed to mark all as read');
    } finally {
      setContextMenuFolder(null);
    }
  };

  const handleEmptyFolder = async (folderId: string) => {
    if (folderId !== 'trash' && folderId !== 'spam') {
      toast.error('Only Trash and Spam can be emptied');
      setContextMenuFolder(null);
      return;
    }

    if (
      !confirm(
        `Are you sure you want to permanently delete all emails in ${folderId}?`
      )
    ) {
      setContextMenuFolder(null);
      return;
    }

    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const result = await emptyFolderAction({
        userId,
        folder: folderId,
      });

      if (result.success) {
        toast.success(result.message);
        // Trigger refresh
        window.dispatchEvent(new CustomEvent('refresh-email-list'));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Empty folder error:', error);
      toast.error('Failed to empty folder');
    } finally {
      setContextMenuFolder(null);
    }
  };

  const handleFolderSettings = (folderId: string) => {
    router.push(`/dashboard/settings?tab=folders&folder=${folderId}`);
    setContextMenuFolder(null);
  };

  const handleCreateRule = (folderId: string) => {
    router.push(`/dashboard/settings?tab=rules&folder=${folderId}`);
    setContextMenuFolder(null);
  };

  const renderFolder = (folder: (typeof primaryFolders)[0]) => {
    const isActive = activeFolder === folder.id;
    const Icon = folder.icon;
    const hasCount = folder.count > 0;

    return (
      <button
        key={folder.id}
        onClick={() => handleFolderClick(folder.id)}
        onContextMenu={(e) => handleContextMenu(e, folder.id)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative',
          isActive
            ? 'bg-primary/10 text-primary border-l-2 border-primary'
            : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 border-l-2 border-transparent',
          isCollapsed && 'justify-center px-2'
        )}
      >
        <Icon size={18} className={cn(isActive && 'text-primary')} />

        {!isCollapsed && (
          <>
            <span className="flex-1 text-left text-sm font-medium">
              {folder.label}
            </span>
            <AnimatePresence>
              {hasCount && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className={cn(
                    'flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-semibold rounded-full',
                    isActive
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  )}
                >
                  {folder.count}
                </motion.span>
              )}
            </AnimatePresence>
          </>
        )}

        {isCollapsed && hasCount && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-[16px] px-1 text-[10px] font-bold text-white bg-primary rounded-full border-2 border-white dark:border-gray-900">
            {folder.count}
          </span>
        )}

        {/* Tooltip for collapsed state */}
        {isCollapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            {folder.label}
            {hasCount && ` (${folder.count})`}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2">
      {/* Primary Folders */}
      <div className="space-y-1 mb-4">{primaryFolders.map(renderFolder)}</div>

      {/* Divider */}
      {!isCollapsed && (
        <div className="my-4 border-t border-gray-200 dark:border-white/10" />
      )}
      {isCollapsed && (
        <div className="my-3 h-px bg-gray-200 dark:bg-white/10" />
      )}

      {/* Standard Folders */}
      <div className="space-y-1">{standardFolders.map(renderFolder)}</div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenuFolder && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setContextMenuFolder(null)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              style={{
                position: 'fixed',
                left: `${contextMenuPosition.x}px`,
                top: `${contextMenuPosition.y}px`,
              }}
              className="z-50 w-52 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden py-1"
            >
              <button
                onClick={() => handleMarkAllRead(contextMenuFolder)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <Check size={16} />
                <span>Mark all as read</span>
              </button>

              {(contextMenuFolder === 'trash' ||
                contextMenuFolder === 'spam') && (
                <button
                  onClick={() => handleEmptyFolder(contextMenuFolder)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={16} />
                  <span>Empty folder</span>
                </button>
              )}

              <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />

              <button
                onClick={() => handleFolderSettings(contextMenuFolder)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <Settings size={16} />
                <span>Folder settings</span>
              </button>

              <button
                onClick={() => handleCreateRule(contextMenuFolder)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <Filter size={16} />
                <span>Create rule</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
