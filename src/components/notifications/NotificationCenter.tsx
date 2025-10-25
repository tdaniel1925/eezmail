'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotificationStore } from '@/stores/notificationStore';
import { NotificationItem } from './NotificationItem';
import { Button } from '@/components/ui/button';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  markAllNotificationsAsRead,
  clearReadNotifications,
  getNotifications,
} from '@/lib/notifications/actions';
import type { NotificationCategory } from '@/db/schema';

const categories: {
  value: 'all' | 'unread' | NotificationCategory;
  label: string;
}[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'email', label: 'Email' },
  { value: 'sync', label: 'Sync' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'contact', label: 'Contacts' },
  { value: 'system', label: 'System' },
];

export function NotificationCenter() {
  const {
    isOpen,
    notifications,
    unreadCount,
    activeFilter,
    setIsOpen,
    setActiveFilter,
    setNotifications,
    setUnreadCount,
  } = useNotificationStore();

  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(
          'button[aria-label*="Notifications"]'
        )
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, setIsOpen]);

  // Handle ESC key
  useEffect(() => {
    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, setIsOpen]);

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
    const result = await getNotifications({ limit: 50 });
    if (result.success && result.notifications) {
      setNotifications(result.notifications);
      setUnreadCount(0);
    }
  };

  const handleClearAll = async () => {
    await clearReadNotifications();
    const result = await getNotifications({ limit: 50 });
    if (result.success && result.notifications) {
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount || 0);
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !notification.isRead;
    return notification.category === activeFilter;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-border bg-background shadow-2xl sm:w-[450px] pl-1"
          >
            {/* Header */}
            <div className="border-b border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#FF4C5A] px-1.5 text-xs font-semibold text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Filter Tabs */}
              <div className="mt-4 flex gap-1 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setActiveFilter(cat.value)}
                    className={cn(
                      'flex-shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      activeFilter === cat.value
                        ? 'bg-[#FF4C5A] text-white'
                        : 'bg-accent text-muted-foreground hover:bg-accent/80'
                    )}
                  >
                    {cat.label}
                    {cat.value === 'unread' && unreadCount > 0 && (
                      <span className="ml-1">({unreadCount})</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              {notifications.length > 0 && (
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    disabled={unreadCount === 0}
                    className="h-8 text-xs"
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Mark all read
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="h-8 text-xs"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Clear read
                  </Button>
                </div>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <Bell className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold">No notifications</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeFilter === 'unread'
                      ? "You're all caught up!"
                      : 'Notifications will appear here'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
