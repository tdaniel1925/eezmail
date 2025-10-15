import { db } from '@/lib/db';
import { customFolders, emails } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { CustomFolder } from '@/db/schema';

export async function getCustomFolderById(
  folderId: string
): Promise<CustomFolder | null> {
  try {
    const [folder] = await db
      .select()
      .from(customFolders)
      .where(eq(customFolders.id, folderId))
      .limit(1);

    return folder || null;
  } catch (error) {
    console.error('Error fetching custom folder:', error);
    return null;
  }
}

export async function getCustomFoldersForUser(
  userId: string
): Promise<CustomFolder[]> {
  try {
    const folders = await db
      .select()
      .from(customFolders)
      .where(eq(customFolders.userId, userId))
      .orderBy(customFolders.sortOrder);

    return folders;
  } catch (error) {
    console.error('Error fetching custom folders:', error);
    return [];
  }
}

export async function getEmailCountByFolder(
  userId: string,
  folderId: string
): Promise<number> {
  try {
    // First verify the folder belongs to the user
    const folder = await db
      .select()
      .from(customFolders)
      .where(
        and(eq(customFolders.id, folderId), eq(customFolders.userId, userId))
      )
      .limit(1);

    if (folder.length === 0) {
      return 0;
    }

    // Count emails in the folder
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(eq(emails.customFolderId, folderId));

    return Number(result[0]?.count ?? 0);
  } catch (error) {
    console.error('Error counting emails in folder:', error);
    return 0;
  }
}

export async function getEmailCountsForAllFolders(
  userId: string
): Promise<Record<string, number>> {
  try {
    const folders = await getCustomFoldersForUser(userId);
    const counts: Record<string, number> = {};

    await Promise.all(
      folders.map(async (folder) => {
        counts[folder.id] = await getEmailCountByFolder(userId, folder.id);
      })
    );

    return counts;
  } catch (error) {
    console.error('Error fetching email counts:', error);
    return {};
  }
}

