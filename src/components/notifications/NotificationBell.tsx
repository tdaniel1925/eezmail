'use client';

import { Bell } from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { getNotifications } from '@/lib/notifications/actions';

export function NotificationBell() {
  const { unreadCount, isOpen, toggleOpen, setNotifications, setUnreadCount } =
    useNotificationStore();

  // Fetch notifications on mount
  useEffect(() => {
    async function loadNotifications() {
      try {
        const result = await getNotifications({ limit: 50 });
        if (result && result.success && result.notifications) {
          setNotifications(result.notifications);
          setUnreadCount(result.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    }
    loadNotifications();
  }, [setNotifications, setUnreadCount]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const result = await getNotifications({ limit: 50 });
        if (result && result.success && result.notifications) {
          setNotifications(result.notifications);
          setUnreadCount(result.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error polling notifications:', error);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [setNotifications, setUnreadCount]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleOpen}
      className={cn(
        'relative h-10 w-10 transition-colors',
        isOpen && 'bg-accent'
      )}
      aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#FF4C5A] px-1 text-xs font-semibold text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>
  );
}
