'use server';

import { db } from '@/lib/db';
import { customFolders, emails } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

/**
 * Create a new custom folder
 */
export async function createFolder(params: {
  userId: string;
  name: string;
  icon?: string;
  color?: string;
}): Promise<{ success: boolean; folderId?: string; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, message: 'Unauthorized' };
    }

    // Check if folder already exists
    const existing = await db.query.customFolders.findFirst({
      where: and(
        eq(customFolders.userId, params.userId),
        eq(customFolders.name, params.name)
      ),
    });

    if (existing) {
      return {
        success: false,
        message: `Folder "${params.name}" already exists`,
      };
    }

    // Create folder
    const [newFolder] = await db
      .insert(customFolders)
      .values({
        userId: params.userId,
        name: params.name,
        icon: params.icon || '📁',
        color: params.color || 'blue',
        sortOrder: 0,
      } as any)
      .returning();

    return {
      success: true,
      folderId: newFolder.id,
      message: `Created folder "${params.name}"`,
    };
  } catch (error) {
    console.error('Error creating folder:', error);
    return { success: false, message: 'Failed to create folder' };
  }
}

/**
 * Delete a custom folder
 */
export async function deleteFolder(params: {
  userId: string;
  folderId: string;
  moveEmailsTo?: string | null;
}): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, message: 'Unauthorized' };
    }

    // Verify folder ownership
    const folder = await db.query.customFolders.findFirst({
      where: eq(customFolders.id, params.folderId),
    });

    if (!folder || folder.userId !== params.userId) {
      return { success: false, message: 'Folder not found' };
    }

    // Move emails if target folder specified
    if (params.moveEmailsTo) {
      await db
        .update(emails)
        .set({
          customFolderId: params.moveEmailsTo,
          updatedAt: new Date(),
        } as any)
        .where(eq(emails.customFolderId, params.folderId));
    } else {
      // Clear folder assignment
      await db
        .update(emails)
        .set({ customFolderId: null, updatedAt: new Date() } as any)
        .where(eq(emails.customFolderId, params.folderId));
    }

    // Delete folder
    await db.delete(customFolders).where(eq(customFolders.id, params.folderId));

    return {
      success: true,
      message: `Deleted folder "${folder.name}"`,
    };
  } catch (error) {
    console.error('Error deleting folder:', error);
    return { success: false, message: 'Failed to delete folder' };
  }
}

/**
 * Rename a custom folder
 */
export async function renameFolder(params: {
  userId: string;
  folderId: string;
  newName: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, message: 'Unauthorized' };
    }

    // Verify folder ownership
    const folder = await db.query.customFolders.findFirst({
      where: eq(customFolders.id, params.folderId),
    });

    if (!folder || folder.userId !== params.userId) {
      return { success: false, message: 'Folder not found' };
    }

    // Check if new name already exists
    const existing = await db.query.customFolders.findFirst({
      where: and(
        eq(customFolders.userId, params.userId),
        eq(customFolders.name, params.newName)
      ),
    });

    if (existing) {
      return {
        success: false,
        message: `Folder "${params.newName}" already exists`,
      };
    }

    // Rename folder
    await db
      .update(customFolders)
      .set({ name: params.newName, updatedAt: new Date() } as any)
      .where(eq(customFolders.id, params.folderId));

    return {
      success: true,
      message: `Renamed folder from "${folder.name}" to "${params.newName}"`,
    };
  } catch (error) {
    console.error('Error renaming folder:', error);
    return { success: false, message: 'Failed to rename folder' };
  }
}

/**
 * List all custom folders for a user
 */
export async function listFolders(params: {
  userId: string;
}): Promise<{ success: boolean; folders: any[]; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, folders: [], message: 'Unauthorized' };
    }

    const folders = await db.query.customFolders.findMany({
      where: eq(customFolders.userId, params.userId),
      orderBy: (folders, { asc }) => [
        asc(folders.sortOrder),
        asc(folders.name),
      ],
    });

    return {
      success: true,
      folders,
      message: `Found ${folders.length} folders`,
    };
  } catch (error) {
    console.error('Error listing folders:', error);
    return { success: false, folders: [], message: 'Failed to list folders' };
  }
}

