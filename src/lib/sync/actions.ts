/**
 * Sync Control Actions
 * Start, pause, resume, cancel, and monitor email syncs
 */

'use server';

import { db } from '@/lib/db';
import { emailAccounts, syncJobs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { syncEmailsFromNylas, type SyncOptions } from '@/lib/nylas/email-sync';
import { revalidatePath } from 'next/cache';

export interface SyncActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Start email sync for an account
 */
export async function startSync(
  accountId: string,
  mode: 'full' | 'incremental' = 'incremental'
): Promise<SyncActionResult> {
  try {
    // Check if account exists
    const [account] = await db
      .select()
      .from(emailAccounts)
      .where(eq(emailAccounts.id, accountId))
      .limit(1);

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Check if already syncing
    if (account.syncStatus === 'syncing') {
      return { success: false, error: 'Sync already in progress' };
    }

    // Update status to syncing
    await db
      .update(emailAccounts)
      .set({
        syncStatus: 'syncing',
        syncProgress: 0,
        updatedAt: new Date(),
      } as Partial<typeof emailAccounts.$inferInsert>)
      .where(eq(emailAccounts.id, accountId));

    // Start sync (in background)
    const options: SyncOptions = { mode };
    const result = await syncEmailsFromNylas(accountId, options);

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/inbox');

    if (result.success) {
      return {
        success: true,
        message: `Synced ${result.emailsSynced} emails`,
      };
    } else {
      return {
        success: false,
        error: result.error || 'Sync failed',
      };
    }
  } catch (error) {
    console.error('Start sync error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Pause ongoing sync
 */
export async function pauseSync(accountId: string): Promise<SyncActionResult> {
  try {
    await db
      .update(emailAccounts)
      .set({
        syncStatus: 'paused',
        updatedAt: new Date(),
      } as Partial<typeof emailAccounts.$inferInsert>)
      .where(eq(emailAccounts.id, accountId));

    revalidatePath('/dashboard/settings');

    return { success: true, message: 'Sync paused' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Resume paused sync
 */
export async function resumeSync(accountId: string): Promise<SyncActionResult> {
  try {
    const [account] = await db
      .select()
      .from(emailAccounts)
      .where(eq(emailAccounts.id, accountId))
      .limit(1);

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    if (account.syncStatus !== 'paused') {
      return { success: false, error: 'Sync is not paused' };
    }

    // Resume sync
    return await startSync(accountId, 'incremental');
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cancel sync and reset status
 */
export async function cancelSync(accountId: string): Promise<SyncActionResult> {
  try {
    await db
      .update(emailAccounts)
      .set({
        syncStatus: 'idle',
        syncProgress: 0,
        syncTotal: 0,
        updatedAt: new Date(),
      } as Partial<typeof emailAccounts.$inferInsert>)
      .where(eq(emailAccounts.id, accountId));

    revalidatePath('/dashboard/settings');

    return { success: true, message: 'Sync cancelled' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get sync status for account
 */
export async function getSyncStatus(accountId: string) {
  const [account] = await db
    .select({
      syncStatus: emailAccounts.syncStatus,
      syncProgress: emailAccounts.syncProgress,
      syncTotal: emailAccounts.syncTotal,
      lastSyncAt: emailAccounts.lastSyncAt,
      lastSuccessfulSyncAt: emailAccounts.lastSuccessfulSyncAt,
      lastSyncError: emailAccounts.lastSyncError,
      errorCount: emailAccounts.errorCount,
      consecutiveErrors: emailAccounts.consecutiveErrors,
    })
    .from(emailAccounts)
    .where(eq(emailAccounts.id, accountId))
    .limit(1);

  return account || null;
}

/**
 * Schedule sync for future execution
 */
export async function scheduleSync(
  accountId: string,
  scheduledFor: Date
): Promise<SyncActionResult> {
  try {
    await db
      .update(emailAccounts)
      .set({
        nextScheduledSyncAt: scheduledFor,
        updatedAt: new Date(),
      } as Partial<typeof emailAccounts.$inferInsert>)
      .where(eq(emailAccounts.id, accountId));

    return {
      success: true,
      message: `Sync scheduled for ${scheduledFor.toLocaleString()}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Reset error count for account
 */
export async function resetErrorCount(
  accountId: string
): Promise<SyncActionResult> {
  try {
    await db
      .update(emailAccounts)
      .set({
        errorCount: 0,
        consecutiveErrors: 0,
        lastSyncError: null,
        updatedAt: new Date(),
      } as Partial<typeof emailAccounts.$inferInsert>)
      .where(eq(emailAccounts.id, accountId));

    return { success: true, message: 'Error count reset' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
