'use server';

import { db } from '@/db';
import { notifications } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { eq, and, desc, sql } from 'drizzle-orm';
import type {
  Notification,
  NewNotification,
  NotificationType,
  NotificationCategory,
} from '@/db/schema';

/**
 * Create a new notification
 */
export async function createNotification(data: {
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message?: string;
  actionUrl?: string;
  actionLabel?: string;
  secondaryActionUrl?: string;
  secondaryActionLabel?: string;
  metadata?: Record<string, unknown>;
  relatedEntityType?: string;
  relatedEntityId?: string;
  expiresAt?: Date;
}): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const [notification] = await db
      .insert(notifications)
      .values({
        userId: user.id,
        type: data.type,
        category: data.category,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
        secondaryActionUrl: data.secondaryActionUrl,
        secondaryActionLabel: data.secondaryActionLabel,
        metadata: data.metadata || {},
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId,
        expiresAt: data.expiresAt,
      })
      .returning();

    return { success: true, notificationId: notification.id };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

/**
 * Get all notifications for current user
 */
export async function getNotifications(options?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  category?: NotificationCategory;
}): Promise<{
  success: boolean;
  notifications?: Notification[];
  unreadCount?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Build query conditions
    const conditions = [
      eq(notifications.userId, user.id),
      eq(notifications.isArchived, false),
    ];

    if (options?.unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    if (options?.category) {
      conditions.push(eq(notifications.category, options.category));
    }

    // Get notifications
    const notificationsList = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(options?.limit || 50)
      .offset(options?.offset || 0);

    // Get unread count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(eq(notifications.userId, user.id), eq(notifications.isRead, false))
      );

    return {
      success: true,
      notifications: notificationsList,
      unreadCount: Number(count),
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: 'Failed to fetch notifications' };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, user.id)
        )
      );

    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: 'Failed to mark as read' };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(notifications.userId, user.id),
          eq(notifications.isRead, false)
        )
      );

    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: 'Failed to mark all as read' };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, user.id)
        )
      );

    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error: 'Failed to delete notification' };
  }
}

/**
 * Archive a notification (soft delete)
 */
export async function archiveNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    await db
      .update(notifications)
      .set({
        isArchived: true,
        archivedAt: new Date(),
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, user.id)
        )
      );

    return { success: true };
  } catch (error) {
    console.error('Error archiving notification:', error);
    return { success: false, error: 'Failed to archive notification' };
  }
}

/**
 * Clear all read notifications
 */
export async function clearReadNotifications(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    await db
      .delete(notifications)
      .where(
        and(eq(notifications.userId, user.id), eq(notifications.isRead, true))
      );

    return { success: true };
  } catch (error) {
    console.error('Error clearing read notifications:', error);
    return { success: false, error: 'Failed to clear notifications' };
  }
}

