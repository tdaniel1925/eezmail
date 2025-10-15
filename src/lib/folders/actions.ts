'use server';

import { db } from '@/lib/db';
import { customFolders } from '@/db/schema';
import { eq, and, sql, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type { NewCustomFolder } from '@/db/schema';

interface CreateFolderInput {
  userId: string;
  name: string;
  icon?: string;
  color?: string;
}

interface UpdateFolderInput {
  name?: string;
  icon?: string;
  color?: string;
}

export async function createCustomFolder(
  input: CreateFolderInput
): Promise<{ success: boolean; folderId?: string; error?: string }> {
  try {
    const { userId, name, icon, color } = input;

    // Validate name length
    if (name.length < 1 || name.length > 50) {
      return {
        success: false,
        error: 'Folder name must be between 1 and 50 characters',
      };
    }

    // Check if user already has 20 folders (max limit)
    const existingFolders = await db
      .select({ count: sql<number>`count(*)` })
      .from(customFolders)
      .where(eq(customFolders.userId, userId));

    const folderCount = Number(existingFolders[0]?.count ?? 0);
    if (folderCount >= 20) {
      return {
        success: false,
        error: 'Maximum of 20 custom folders allowed',
      };
    }

    // Check for duplicate name (case-insensitive)
    const duplicate = await db
      .select()
      .from(customFolders)
      .where(
        and(
          eq(customFolders.userId, userId),
          sql`LOWER(${customFolders.name}) = LOWER(${name})`
        )
      )
      .limit(1);

    if (duplicate.length > 0) {
      return {
        success: false,
        error: 'A folder with this name already exists',
      };
    }

    // Get the next sort order
    const maxOrder = await db
      .select({ max: sql<number>`MAX(${customFolders.sortOrder})` })
      .from(customFolders)
      .where(eq(customFolders.userId, userId));

    const sortOrder = Number(maxOrder[0]?.max ?? -1) + 1;

    // Create the folder
    const newFolder: NewCustomFolder = {
      userId,
      name,
      icon: icon || '📁',
      color: color || 'gray',
      sortOrder,
    };

    const [created] = await db
      .insert(customFolders)
      .values(newFolder)
      .returning();

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/settings');

    return { success: true, folderId: created.id };
  } catch (error) {
    console.error('Error creating custom folder:', error);
    return { success: false, error: 'Failed to create folder' };
  }
}

export async function updateCustomFolder(
  folderId: string,
  userId: string,
  updates: UpdateFolderInput
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify ownership
    const existing = await db
      .select()
      .from(customFolders)
      .where(
        and(eq(customFolders.id, folderId), eq(customFolders.userId, userId))
      )
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: 'Folder not found' };
    }

    // Check for duplicate name if name is being updated
    if (updates.name) {
      if (updates.name.length < 1 || updates.name.length > 50) {
        return {
          success: false,
          error: 'Folder name must be between 1 and 50 characters',
        };
      }

      const duplicate = await db
        .select()
        .from(customFolders)
        .where(
          and(
            eq(customFolders.userId, userId),
            sql`LOWER(${customFolders.name}) = LOWER(${updates.name})`,
            sql`${customFolders.id} != ${folderId}`
          )
        )
        .limit(1);

      if (duplicate.length > 0) {
        return {
          success: false,
          error: 'A folder with this name already exists',
        };
      }
    }

    await db
      .update(customFolders)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(customFolders.id, folderId));

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/settings');

    return { success: true };
  } catch (error) {
    console.error('Error updating custom folder:', error);
    return { success: false, error: 'Failed to update folder' };
  }
}

export async function deleteCustomFolder(
  folderId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify ownership
    const existing = await db
      .select()
      .from(customFolders)
      .where(
        and(eq(customFolders.id, folderId), eq(customFolders.userId, userId))
      )
      .limit(1);

    if (existing.length === 0) {
      return { success: false, error: 'Folder not found' };
    }

    // Check if folder has emails
    // Note: This will be handled by database cascade (set null)
    // But we could add a check here if we want to prevent deletion

    await db.delete(customFolders).where(eq(customFolders.id, folderId));

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/settings');

    return { success: true };
  } catch (error) {
    console.error('Error deleting custom folder:', error);
    return { success: false, error: 'Failed to delete folder' };
  }
}

export async function getCustomFolders(): Promise<{
  success: boolean;
  folders: any[];
  error?: string;
}> {
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, folders: [], error: 'Not authenticated' };
    }

    const folders = await db
      .select()
      .from(customFolders)
      .where(eq(customFolders.userId, user.id))
      .orderBy(asc(customFolders.sortOrder));

    return { success: true, folders };
  } catch (error) {
    console.error('Error fetching custom folders:', error);
    return { success: false, folders: [], error: 'Failed to fetch folders' };
  }
}

export async function reorderCustomFolders(
  userId: string,
  folderIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update sort order for each folder
    await Promise.all(
      folderIds.map((folderId, index) =>
        db
          .update(customFolders)
          .set({ sortOrder: index, updatedAt: new Date() })
          .where(
            and(
              eq(customFolders.id, folderId),
              eq(customFolders.userId, userId)
            )
          )
      )
    );

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/settings');

    return { success: true };
  } catch (error) {
    console.error('Error reordering custom folders:', error);
    return { success: false, error: 'Failed to reorder folders' };
  }
}

