'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * Mark all emails in a folder as read
 */
export async function markFolderAsRead(params: {
  userId: string;
  folder: string;
}): Promise<{ success: boolean; count: number; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, count: 0, message: 'Unauthorized' };
    }

    // Get all unread emails in the folder
    const folderEmails = await db.query.emails.findMany({
      where: and(
        eq(emails.accountId, params.userId),
        eq(emails.emailCategory, params.folder as any),
        eq(emails.isRead, false)
      ),
    });

    if (folderEmails.length === 0) {
      return {
        success: true,
        count: 0,
        message: 'All emails already read',
      };
    }

    const emailIds = folderEmails.map((e) => e.id);

    // Update all to read
    await db
      .update(emails)
      .set({ isRead: true, updatedAt: new Date() } as any)
      .where(inArray(emails.id, emailIds));

    return {
      success: true,
      count: emailIds.length,
      message: `Marked ${emailIds.length} emails as read`,
    };
  } catch (error) {
    console.error('Error in markFolderAsRead:', error);
    return { success: false, count: 0, message: 'Failed to mark as read' };
  }
}

/**
 * Empty a folder (permanently delete all emails in trash or spam)
 */
export async function emptyFolder(params: {
  userId: string;
  folder: string;
}): Promise<{ success: boolean; count: number; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, count: 0, message: 'Unauthorized' };
    }

    // Only allow emptying trash or spam
    if (params.folder !== 'trash' && params.folder !== 'spam') {
      return {
        success: false,
        count: 0,
        message: 'Only Trash and Spam folders can be emptied',
      };
    }

    // Get all emails in the folder
    const folderEmails = await db.query.emails.findMany({
      where: and(
        eq(emails.accountId, params.userId),
        eq(emails.emailCategory, params.folder as any)
      ),
    });

    if (folderEmails.length === 0) {
      return {
        success: true,
        count: 0,
        message: `${params.folder} is already empty`,
      };
    }

    const emailIds = folderEmails.map((e) => e.id);

    // Permanently delete
    await db.delete(emails).where(inArray(emails.id, emailIds));

    return {
      success: true,
      count: emailIds.length,
      message: `Permanently deleted ${emailIds.length} emails from ${params.folder}`,
    };
  } catch (error) {
    console.error('Error in emptyFolder:', error);
    return { success: false, count: 0, message: 'Failed to empty folder' };
  }
}
