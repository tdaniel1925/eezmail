/**
 * Cleanup Service
 * Handles cleanup of orphaned database records
 */

import { db } from '@/lib/db';
import { emailFolders } from '@/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

/**
 * Clean up orphaned folders that have no associated account
 * This can happen if:
 * - Account creation fails mid-process
 * - OAuth flow is abandoned
 * - User deletes account before sync completes
 */
export async function cleanupOrphanedFolders(
  userId: string
): Promise<{ deletedCount: number }> {
  try {
    console.log(`🧹 Cleaning up orphaned folders for user ${userId}`);

    const result = await db
      .delete(emailFolders)
      .where(
        and(eq(emailFolders.userId, userId), isNull(emailFolders.accountId))
      )
      .returning();

    console.log(`✅ Deleted ${result.length} orphaned folders`);

    return { deletedCount: result.length };
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return { deletedCount: 0 };
  }
}

/**
 * Clean up all orphaned folders (admin function)
 */
export async function cleanupAllOrphanedFolders(): Promise<{
  deletedCount: number;
}> {
  try {
    console.log('🧹 Cleaning up all orphaned folders (admin)');

    const result = await db
      .delete(emailFolders)
      .where(isNull(emailFolders.accountId))
      .returning();

    console.log(`✅ Deleted ${result.length} orphaned folders`);

    return { deletedCount: result.length };
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return { deletedCount: 0 };
  }
}
