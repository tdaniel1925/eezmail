'use server';

/**
 * Dual-Mode Sync System
 * - Real-time sync: Every 30 seconds for new emails
 * - Historical sync: Every minute until all emails are synced
 */

import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { syncEmailAccount } from './email-sync-service';

// Store active sync intervals globally
const activeSyncIntervals = new Map<
  string,
  { realtime?: NodeJS.Timeout; historical?: NodeJS.Timeout }
>();

/**
 * Start real-time sync for new emails (every 30 seconds)
 */
export async function startRealtimeSync(
  accountId: string
): Promise<{ success: boolean; message: string }> {
  // Clear any existing realtime interval
  const existing = activeSyncIntervals.get(accountId);
  if (existing?.realtime) {
    clearInterval(existing.realtime);
  }

  const interval = setInterval(async () => {
    try {
      console.log(`🔄 Real-time sync for account: ${accountId}`);
      await syncEmailAccount(accountId, 'auto');
    } catch (error) {
      console.error('Real-time sync error:', error);
    }
  }, 30000); // 30 seconds

  // Store interval ID
  const intervals = activeSyncIntervals.get(accountId) || {};
  intervals.realtime = interval;
  activeSyncIntervals.set(accountId, intervals);

  console.log(`✅ Real-time sync started for account: ${accountId}`);
  return { success: true, message: 'Real-time sync started' };
}

/**
 * Start background historical sync (every minute until complete)
 */
export async function startHistoricalSync(
  accountId: string
): Promise<{ success: boolean; message: string }> {
  // Check if historical sync is complete
  const account = await db.query.emailAccounts.findFirst({
    where: eq(emailAccounts.id, accountId),
  });

  const isComplete =
    account?.syncStatus === 'success' &&
    (account?.syncProgress || 0) >= (account?.syncTotal || 0) &&
    account?.syncCursor === null;

  if (isComplete) {
    console.log(
      `✅ Historical sync already complete for account: ${accountId}`
    );
    return { success: true, message: 'Already complete' };
  }

  // Clear any existing historical interval
  const existing = activeSyncIntervals.get(accountId);
  if (existing?.historical) {
    clearInterval(existing.historical);
  }

  const interval = setInterval(async () => {
    try {
      console.log(`📚 Historical sync for account: ${accountId}`);
      const result = await syncEmailAccount(accountId, 'manual');

      // Stop if complete
      if (result?.isComplete) {
        clearInterval(interval);

        // Remove from active intervals
        const intervals = activeSyncIntervals.get(accountId);
        if (intervals) {
          delete intervals.historical;
          if (Object.keys(intervals).length === 0) {
            activeSyncIntervals.delete(accountId);
          } else {
            activeSyncIntervals.set(accountId, intervals);
          }
        }

        console.log(`✅ Historical sync completed for account: ${accountId}`);
      }
    } catch (error) {
      console.error('Historical sync error:', error);
    }
  }, 60000); // 1 minute

  // Store interval ID
  const intervals = activeSyncIntervals.get(accountId) || {};
  intervals.historical = interval;
  activeSyncIntervals.set(accountId, intervals);

  console.log(`✅ Historical sync started for account: ${accountId}`);
  return { success: true, message: 'Historical sync started' };
}

/**
 * Start dual-mode sync: both real-time and historical
 */
export async function startDualModeSync(accountId: string): Promise<{
  success: boolean;
  realtime: { success: boolean; message: string };
  historical: { success: boolean; message: string };
}> {
  console.log(`🚀 Starting dual-mode sync for account: ${accountId}`);

  const realtimeResult = await startRealtimeSync(accountId);
  const historicalResult = await startHistoricalSync(accountId);

  return {
    success: true,
    realtime: realtimeResult,
    historical: historicalResult,
  };
}

/**
 * Stop all sync for an account
 */
export async function stopAllSync(accountId: string): Promise<void> {
  const intervals = activeSyncIntervals.get(accountId);

  if (intervals) {
    if (intervals.realtime) {
      clearInterval(intervals.realtime);
      console.log(`⏸️ Stopped real-time sync for account: ${accountId}`);
    }
    if (intervals.historical) {
      clearInterval(intervals.historical);
      console.log(`⏸️ Stopped historical sync for account: ${accountId}`);
    }
    activeSyncIntervals.delete(accountId);
  }
}

/**
 * Stop only historical sync (keep real-time)
 */
export async function stopHistoricalSync(accountId: string): Promise<void> {
  const intervals = activeSyncIntervals.get(accountId);

  if (intervals?.historical) {
    clearInterval(intervals.historical);
    delete intervals.historical;

    if (Object.keys(intervals).length === 0) {
      activeSyncIntervals.delete(accountId);
    } else {
      activeSyncIntervals.set(accountId, intervals);
    }

    console.log(`⏸️ Stopped historical sync for account: ${accountId}`);
  }
}

/**
 * Check if account has active syncs
 */
export async function getSyncStatus(accountId: string): Promise<{
  hasRealtimeSync: boolean;
  hasHistoricalSync: boolean;
}> {
  const intervals = activeSyncIntervals.get(accountId);

  return {
    hasRealtimeSync: !!intervals?.realtime,
    hasHistoricalSync: !!intervals?.historical,
  };
}






