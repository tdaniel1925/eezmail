'use client';

import { formatDistanceToNow } from 'date-fns';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
  ExternalLink,
} from 'lucide-react';
import type { Notification } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  markNotificationAsRead,
  deleteNotification,
} from '@/lib/notifications/actions';
import { useNotificationStore } from '@/stores/notificationStore';
import Link from 'next/link';

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { removeNotification, markAsRead } = useNotificationStore();

  const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: 'text-green-500 bg-green-500/10',
    error: 'text-red-500 bg-red-500/10',
    warning: 'text-yellow-500 bg-yellow-500/10',
    info: 'text-blue-500 bg-blue-500/10',
  };

  const Icon = icons[notification.type];

  const handleMarkAsRead = async () => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
      markAsRead(notification.id);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(notification.id);
    removeNotification(notification.id);
  };

  const handleActionClick = async () => {
    await handleMarkAsRead();
  };

  return (
    <div
      className={cn(
        'group relative border-b border-border p-4 transition-colors hover:bg-accent/50',
        !notification.isRead && 'bg-accent/30'
      )}
      onClick={handleMarkAsRead}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
            colors[notification.type]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold">{notification.title}</h4>
              {notification.message && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {notification.message}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={handleDelete}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Timestamp */}
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </p>

          {/* Actions */}
          {(notification.actionUrl || notification.secondaryActionUrl) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {notification.actionUrl && notification.actionLabel && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleActionClick}
                  asChild
                >
                  <Link href={notification.actionUrl}>
                    {notification.actionLabel}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              )}
              {notification.secondaryActionUrl &&
                notification.secondaryActionLabel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={handleActionClick}
                    asChild
                  >
                    <Link href={notification.secondaryActionUrl}>
                      {notification.secondaryActionLabel}
                    </Link>
                  </Button>
                )}
            </div>
          )}

          {/* Unread indicator */}
          {!notification.isRead && (
            <div className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#FF4C5A]" />
          )}
        </div>
      </div>
    </div>
  );
}
