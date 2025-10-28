import { inngest } from '@/inngest/client';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';

export interface SyncRequest {
  accountId: string;
  syncMode: 'initial' | 'incremental';
  trigger: 'oauth' | 'manual' | 'scheduled' | 'webhook';
}

/**
 * Unified Sync Orchestrator - THE ONLY entry point for email sync
 * Triggers Inngest durable workflows for reliable sync
 */
export async function syncAccount(request: SyncRequest): Promise<{
  success: boolean;
  runId?: string;
  error?: string;
}> {
  const { accountId, syncMode, trigger } = request;
  
  console.log(`🚀 Sync requested: ${accountId} (${syncMode}, ${trigger})`);

  // 1. Validate account exists
  const account = await db.query.emailAccounts.findFirst({
    where: eq(emailAccounts.id, accountId),
  });

  if (!account) {
    console.error(`❌ Account not found: ${accountId}`);
    return { success: false, error: 'Account not found' };
  }

  // 2. Check if already syncing (prevent duplicate syncs)
  if (account.syncStatus === 'syncing') {
    console.log(`⚠️ Sync already in progress for account: ${accountId}`);
    return { success: false, error: 'Sync already in progress' };
  }

  // 3. Send event to Inngest FIRST, only update status if successful
  try {
    const { ids } = await inngest.send({
      name: 'sync/account',
      data: {
        accountId,
        userId: account.userId,
        provider: account.provider,
        syncMode,
        trigger,
        timestamp: Date.now(),
      },
    });

    // Only update status AFTER Inngest confirms receipt
    await db
      .update(emailAccounts)
      .set({ 
        syncStatus: 'syncing', 
        syncProgress: 0,
        updatedAt: new Date(),
      } as any)
      .where(eq(emailAccounts.id, accountId));

    console.log(`✅ Sync triggered successfully! Run ID: ${ids[0]}`);
    return { success: true, runId: ids[0] };
  } catch (error) {
    console.error('❌ Failed to send Inngest event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start sync',
    };
  }
}

/**
 * Reset accounts stuck in "syncing" status for more than 10 minutes
 * This prevents accounts from being permanently stuck
 * Should be called periodically (e.g., on dashboard load or via cron)
 */
export async function resetStuckSyncs(): Promise<number> {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  console.log(`🔍 Checking for stuck syncs older than ${tenMinutesAgo.toISOString()}`);

  const stuckAccounts = await db
    .update(emailAccounts)
    .set({
      syncStatus: 'idle',
      lastSyncError: 'Sync timed out after 10 minutes',
      updatedAt: new Date(),
    } as any)
    .where(
      and(
        eq(emailAccounts.syncStatus, 'syncing'),
        lt(emailAccounts.updatedAt, tenMinutesAgo)
      )
    )
    .returning({ id: emailAccounts.id, emailAddress: emailAccounts.emailAddress });

  if (stuckAccounts.length > 0) {
    console.log(`✅ Reset ${stuckAccounts.length} stuck sync(s):`, stuckAccounts.map(a => a.emailAddress));
  } else {
    console.log('✅ No stuck syncs found');
  }

  return stuckAccounts.length;
}

/**
 * Get sync status for an account
 */
export async function getSyncStatus(accountId: string): Promise<{
  status: string;
  progress: number;
  lastSync?: Date | null;
  lastError?: string | null;
} | null> {
  const account = await db.query.emailAccounts.findFirst({
    where: eq(emailAccounts.id, accountId),
    columns: {
      syncStatus: true,
      syncProgress: true,
      lastSyncAt: true,
      lastSyncError: true,
    },
  });

  if (!account) {
    return null;
  }

  return {
    status: account.syncStatus || 'idle',
    progress: account.syncProgress || 0,
    lastSync: account.lastSyncAt,
    lastError: account.lastSyncError,
  };
}
