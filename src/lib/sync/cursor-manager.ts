/**
 * Sync Cursor Management
 * Handles persistence and retrieval of sync cursors for incremental sync
 */

'use server';

import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Save sync cursor after successful batch
 */
export async function saveSyncCursor(
  accountId: string,
  cursor: string,
  timestamp: Date = new Date()
): Promise<void> {
  await db
    .update(emailAccounts)
    .set({
      syncCursor: cursor,
      lastSyncAt: timestamp,
      updatedAt: new Date(),
    } as Partial<typeof emailAccounts.$inferInsert>)
    .where(eq(emailAccounts.id, accountId));
}

/**
 * Get current sync cursor for account
 */
export async function getSyncCursor(accountId: string): Promise<string | null> {
  const [account] = await db
    .select({ syncCursor: emailAccounts.syncCursor })
    .from(emailAccounts)
    .where(eq(emailAccounts.id, accountId))
    .limit(1);

  return account?.syncCursor || null;
}

/**
 * Clear sync cursor (force full resync)
 */
export async function clearSyncCursor(accountId: string): Promise<void> {
  await db
    .update(emailAccounts)
    .set({
      syncCursor: null,
      updatedAt: new Date(),
    } as Partial<typeof emailAccounts.$inferInsert>)
    .where(eq(emailAccounts.id, accountId));
}

/**
 * Update sync progress during sync
 */
export async function updateSyncProgress(
  accountId: string,
  current: number,
  total?: number
): Promise<void> {
  const updateData: any = {
    syncProgress: current,
    updatedAt: new Date(),
  };

  if (total !== undefined) {
    updateData.syncTotal = total;
  }

  await db
    .update(emailAccounts)
    .set(updateData)
    .where(eq(emailAccounts.id, accountId));
}

/**
 * Mark sync as successful
 */
export async function markSyncSuccessful(
  accountId: string,
  cursor?: string
): Promise<void> {
  const now = new Date();

  await db
    .update(emailAccounts)
    .set({
      syncStatus: 'success',
      lastSuccessfulSyncAt: now,
      lastSyncAt: now,
      syncCursor: cursor || null,
      errorCount: 0,
      consecutiveErrors: 0,
      lastSyncError: null,
      updatedAt: now,
    } as Partial<typeof emailAccounts.$inferInsert>)
    .where(eq(emailAccounts.id, accountId));
}

/**
 * Mark sync as failed
 */
export async function markSyncFailed(
  accountId: string,
  error: string
): Promise<void> {
  // Increment error counts
  const [account] = await db
    .select({
      errorCount: emailAccounts.errorCount,
      consecutiveErrors: emailAccounts.consecutiveErrors,
    })
    .from(emailAccounts)
    .where(eq(emailAccounts.id, accountId))
    .limit(1);

  await db
    .update(emailAccounts)
    .set({
      syncStatus: 'error',
      lastSyncError: error,
      lastSyncAt: new Date(),
      errorCount: (account?.errorCount || 0) + 1,
      consecutiveErrors: (account?.consecutiveErrors || 0) + 1,
      updatedAt: new Date(),
    } as Partial<typeof emailAccounts.$inferInsert>)
    .where(eq(emailAccounts.id, accountId));
}
