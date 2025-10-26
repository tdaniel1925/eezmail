'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails, customFolders, emailFolders } from '@/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';

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

/**
 * Create a custom folder
 */
export async function createCustomFolder(params: {
  accountId: string;
  name: string;
  color?: string;
}): Promise<{ success: boolean; folderId?: string; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    // Insert new custom folder
    const result = await db
      .insert(customFolders)
      .values({
        accountId: params.accountId,
        userId: user.id,
        name: params.name,
        color: params.color || '#3B82F6',
        sortOrder: 0,
      })
      .returning();

    return {
      success: true,
      folderId: result[0].id,
      message: `Created folder "${params.name}"`,
    };
  } catch (error) {
    console.error('Error in createCustomFolder:', error);
    return { success: false, message: 'Failed to create folder' };
  }
}

/**
 * Delete a custom folder
 */
export async function deleteCustomFolder(params: {
  folderId: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    // Delete the folder
    await db.delete(customFolders).where(eq(customFolders.id, params.folderId));

    return {
      success: true,
      message: 'Folder deleted successfully',
    };
  } catch (error) {
    console.error('Error in deleteCustomFolder:', error);
    return { success: false, message: 'Failed to delete folder' };
  }
}

/**
 * Get all custom folders for the current user
 */
export async function getCustomFolders(): Promise<{
  success: boolean;
  folders: any[];
  message?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, folders: [], message: 'Unauthorized' };
    }

    // Get all custom folders for the user, sorted by sortOrder
    const folders = await db.query.customFolders.findMany({
      where: eq(customFolders.userId, user.id),
      orderBy: (folders, { asc }) => [
        asc(folders.sortOrder),
        asc(folders.name),
      ],
    });

    return {
      success: true,
      folders,
    };
  } catch (error) {
    console.error('Error in getCustomFolders:', error);
    return { success: false, folders: [], message: 'Failed to fetch folders' };
  }
}

/**
 * Get email folders for a specific account
 */
export async function getEmailFolders(params: { accountId: string }): Promise<{
  success: boolean;
  folders: Array<{
    id: string;
    name: string;
    type: string;
    externalId: string;
    unreadCount: number;
    folderType?: string; // NEW
    displayName?: string; // NEW
    icon?: string; // NEW
    sortOrder?: number; // NEW
  }>;
  message?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, folders: [], message: 'Unauthorized' };
    }

    // Get all folders for this account
    const folders = await db.query.emailFolders.findMany({
      where: eq(emailFolders.accountId, params.accountId),
      columns: {
        id: true,
        name: true,
        type: true,
        externalId: true,
        unreadCount: true,
        folderType: true, // NEW
        displayName: true, // NEW
        icon: true, // NEW
        sortOrder: true, // NEW
      },
    });

    return {
      success: true,
      folders,
    };
  } catch (error) {
    console.error('Error in getEmailFolders:', error);
    return { success: false, folders: [], message: 'Failed to fetch folders' };
  }
}

/**
 * Reorder custom folders
 */
export async function reorderCustomFolders(params: {
  folderIds: string[];
}): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    // Update sort order for each folder
    for (let i = 0; i < params.folderIds.length; i++) {
      await db
        .update(customFolders)
        .set({ sortOrder: i })
        .where(eq(customFolders.id, params.folderIds[i]));
    }

    return {
      success: true,
      message: 'Folders reordered successfully',
    };
  } catch (error) {
    console.error('Error in reorderCustomFolders:', error);
    return { success: false, message: 'Failed to reorder folders' };
  }
}
