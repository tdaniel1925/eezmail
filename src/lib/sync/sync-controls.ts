'use server';

/**
 * Sync Control Functions
 * - Pause/Resume sync
 * - Set sync priority
 * - Manual sync triggers
 */

import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { syncEmailAccount } from './email-sync-service';
import { stopAllSync, startDualModeSync } from './sync-modes';

/**
 * Pause sync for an account
 */
export async function pauseSync(
  accountId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update database status
    await db
      .update(emailAccounts)
      .set({
        syncStatus: 'paused' as any,
        updatedAt: new Date(),
      } as any)
      .where(eq(emailAccounts.id, accountId));

    // Stop all active sync intervals
    await stopAllSync(accountId);

    console.log(`⏸️ Sync paused for account: ${accountId}`);
    return { success: true };
  } catch (error) {
    console.error('Error pausing sync:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to pause sync',
    };
  }
}

/**
 * Resume sync for an account
 */
export async function resumeSync(
  accountId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Update database status
    await db
      .update(emailAccounts)
      .set({
        syncStatus: 'syncing' as any,
        updatedAt: new Date(),
      } as any)
      .where(eq(emailAccounts.id, accountId));

    // Restart dual-mode sync
    await startDualModeSync(accountId);

    console.log(`▶️ Sync resumed for account: ${accountId}`);
    return { success: true };
  } catch (error) {
    console.error('Error resuming sync:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resume sync',
    };
  }
}

/**
 * Set sync priority for an account
 */
export async function setSyncPriority(
  accountId: string,
  priority: 'high' | 'normal' | 'low'
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(emailAccounts)
      .set({
        syncPriority: priority,
        updatedAt: new Date(),
      } as any)
      .where(eq(emailAccounts.id, accountId));

    console.log(
      `🎯 Sync priority set to ${priority} for account: ${accountId}`
    );
    return { success: true };
  } catch (error) {
    console.error('Error setting sync priority:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to set sync priority',
    };
  }
}

/**
 * Trigger a manual sync (one-time)
 */
export async function triggerManualSync(accountId: string): Promise<{
  success: boolean;
  syncedCount?: number;
  error?: string;
}> {
  try {
    console.log(`🔄 Manual sync triggered for account: ${accountId}`);

    // Set status to syncing
    await db
      .update(emailAccounts)
      .set({
        syncStatus: 'syncing' as any,
        updatedAt: new Date(),
      } as any)
      .where(eq(emailAccounts.id, accountId));

    // Perform manual sync
    const result = await syncEmailAccount(accountId, 'manual');

    return {
      success: true,
      syncedCount: result?.syncedCount || 0,
    };
  } catch (error) {
    console.error('Error in manual sync:', error);

    // Set status to error
    await db
      .update(emailAccounts)
      .set({
        syncStatus: 'error' as any,
        lastSyncError:
          error instanceof Error ? error.message : 'Manual sync failed',
        updatedAt: new Date(),
      } as any)
      .where(eq(emailAccounts.id, accountId));

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Manual sync failed',
    };
  }
}

/**
 * Cancel ongoing sync for an account
 */
export async function cancelSync(
  accountId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Stop all sync intervals
    await stopAllSync(accountId);

    // Update database status
    await db
      .update(emailAccounts)
      .set({
        syncStatus: 'idle' as any,
        updatedAt: new Date(),
      } as any)
      .where(eq(emailAccounts.id, accountId));

    console.log(`❌ Sync cancelled for account: ${accountId}`);
    return { success: true };
  } catch (error) {
    console.error('Error cancelling sync:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel sync',
    };
  }
}

/**
 * Reset sync progress (start from beginning)
 */
export async function resetSyncProgress(
  accountId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(emailAccounts)
      .set({
        syncProgress: 0,
        syncTotal: 0,
        syncCursor: null,
        syncStatus: 'idle' as any,
        updatedAt: new Date(),
      } as any)
      .where(eq(emailAccounts.id, accountId));

    console.log(`🔄 Sync progress reset for account: ${accountId}`);
    return { success: true };
  } catch (error) {
    console.error('Error resetting sync progress:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to reset sync progress',
    };
  }
}






