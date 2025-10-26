'use server';

import { inngest } from '@/inngest/client';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { checkInngestHealth } from '@/lib/inngest/health-check';

/**
 * SYNC ORCHESTRATOR
 * Single entry point for ALL sync operations across all providers
 * Replaces: syncInBackground, startDualModeSync, etc.
 *
 * This is the ONLY way to trigger email sync in the application.
 */

export type SyncTrigger = 'oauth' | 'manual' | 'scheduled';
export type SyncMode = 'initial' | 'incremental';

interface SyncRequest {
  accountId: string;
  userId: string;
  trigger: SyncTrigger;
}

/**
 * Trigger sync for any provider
 * This is the single source of truth for starting email sync
 */
export async function triggerSync(request: SyncRequest): Promise<{
  success: boolean;
  runId?: string;
  error?: string;
}> {
  try {
    const { accountId, userId, trigger } = request;

    console.log(`🎯 Sync trigger requested`);
    console.log(`   Account: ${accountId}`);
    console.log(`   Trigger: ${trigger}`);

    // 1. Check if Inngest is healthy (in development)
    const inngestHealth = await checkInngestHealth();
    if (!inngestHealth.healthy) {
      console.error(`❌ Cannot start sync: ${inngestHealth.error}`);
      return {
        success: false,
        error: `Cannot start sync: ${inngestHealth.error}`,
      };
    }

    // 2. Validate account exists and belongs to user
    const account = await db.query.emailAccounts.findFirst({
      where: and(
        eq(emailAccounts.id, accountId),
        eq(emailAccounts.userId, userId)
      ),
    });

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // 3. Determine sync mode based on trigger
    // ALWAYS do initial sync for manual triggers until we get emails
    // This fixes the loop where incremental sync returns 0 emails
    const syncMode: SyncMode =
      trigger === 'manual' || !account.initialSyncCompleted
        ? 'initial'
        : 'incremental';

    console.log(
      `📊 Sync mode: ${syncMode} (trigger: ${trigger}, initialSyncCompleted: ${account.initialSyncCompleted})`
    );

    // 4. Check if sync is already running (prevent duplicate syncs)
    if (account.syncStatus === 'syncing') {
      console.log(`⚠️ Sync already in progress for account ${accountId}`);
      return {
        success: false,
        error:
          'Sync already in progress. Please wait for current sync to complete.',
      };
    }

    // 5. Mark as syncing
    await db
      .update(emailAccounts)
      .set({
        syncStatus: 'syncing',
        syncProgress: 0,
        updatedAt: new Date(),
      } as any)
      .where(eq(emailAccounts.id, accountId));

    console.log(`✅ Account marked as syncing`);

    // Safety timeout: Auto-reset if sync is ACTUALLY stuck (no progress)
    // Initial syncs can take longer, so we use a longer timeout and check for progress
    const timeoutDuration =
      syncMode === 'initial' ? 120 * 60 * 1000 : 30 * 60 * 1000; // 2 hours for initial, 30 min for incremental
    const startProgress = 0;
    const startTime = Date.now();

    setTimeout(async () => {
      try {
        const checkAccount = await db.query.emailAccounts.findFirst({
          where: and(
            eq(emailAccounts.id, accountId),
            eq(emailAccounts.userId, userId)
          ),
        });

        if (checkAccount && checkAccount.syncStatus === 'syncing') {
          // Check if progress was made - if syncProgress changed OR updatedAt is recent, sync is active
          const progressMade = (checkAccount.syncProgress || 0) > startProgress;
          const recentUpdate =
            checkAccount.updatedAt &&
            Date.now() - new Date(checkAccount.updatedAt).getTime() <
              10 * 60 * 1000; // Updated in last 10 minutes

          if (progressMade || recentUpdate) {
            console.log(
              `✅ Sync still active for account ${accountId} (progress: ${checkAccount.syncProgress}%) - NOT resetting`
            );
            return; // Don't reset - sync is making progress
          }

          // Only reset if truly stuck with no progress
          console.warn(
            `⚠️ Sync appears STUCK for account ${accountId} - auto-resetting status`
          );
          console.warn(`   Last progress: ${checkAccount.syncProgress}%`);
          console.warn(`   Account: ${checkAccount.emailAddress}`);
          console.warn(
            `   Time elapsed: ${Math.round((Date.now() - startTime) / 60000)} minutes`
          );

          await db
            .update(emailAccounts)
            .set({
              syncStatus: 'idle',
              syncProgress: 0,
              status: 'active',
              lastSyncError:
                'Sync appears to be stuck with no progress. Please try syncing again.',
              lastSyncAt: new Date(),
            } as any)
            .where(eq(emailAccounts.id, accountId));

          console.log('✅ Sync status auto-reset due to being stuck');
        }
      } catch (error) {
        console.error('❌ Error in safety timeout handler:', error);
        // Don't throw - this is a background safety check
      }
    }, timeoutDuration);

    // 6. Trigger appropriate Inngest function based on provider
    let eventName: string;
    switch (account.provider) {
      case 'microsoft':
        eventName = 'email/microsoft.sync';
        break;
      case 'gmail':
        eventName = 'email/gmail.sync';
        break;
      case 'imap':
      case 'yahoo':
        eventName = 'email/imap.sync';
        break;
      default:
        // Revert sync status if provider is unsupported
        await db
          .update(emailAccounts)
          .set({ syncStatus: 'idle' } as any)
          .where(eq(emailAccounts.id, accountId));

        return {
          success: false,
          error: `Unsupported provider: ${account.provider}`,
        };
    }

    // 7. Send event to Inngest with all required data
    try {
      const { ids } = await inngest.send({
        name: eventName,
        data: {
          accountId,
          userId,
          syncMode,
          trigger,
          timestamp: Date.now(),
        },
      });

      const runId = ids[0];

      console.log(`✅ Sync triggered successfully!`);
      console.log(`   Event: ${eventName}`);
      console.log(`   Run ID: ${runId}`);
      console.log(`   Mode: ${syncMode}`);
      console.log(`   Trigger: ${trigger}`);

      return {
        success: true,
        runId,
      };
    } catch (inngestError) {
      // If Inngest send fails, reset sync status immediately
      console.error('❌ Failed to send event to Inngest:', inngestError);

      await db
        .update(emailAccounts)
        .set({
          syncStatus: 'idle',
          syncProgress: 0,
          lastSyncError: `Failed to start sync: ${inngestError instanceof Error ? inngestError.message : 'Inngest connection error'}`,
        } as any)
        .where(eq(emailAccounts.id, accountId));

      console.log('✅ Sync status reset after Inngest send failure');

      throw inngestError; // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    console.error('❌ Failed to trigger sync:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get current sync status for an account
 * Single source of truth for sync state
 */
export async function getSyncStatus(accountId: string, userId: string) {
  try {
    const account = await db.query.emailAccounts.findFirst({
      where: and(
        eq(emailAccounts.id, accountId),
        eq(emailAccounts.userId, userId)
      ),
    });

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Count total emails for this account
    const emailCountResult = await db.execute(
      sql`SELECT COUNT(*)::int as count FROM emails WHERE account_id = ${accountId}::uuid`
    );
    const emailCount = (emailCountResult[0] as any)?.count || 0;

    // Count total folders for this account
    const folderCountResult = await db.execute(
      sql`SELECT COUNT(*)::int as count FROM email_folders WHERE account_id = ${accountId}::uuid`
    );
    const folderCount = (folderCountResult[0] as any)?.count || 0;

    return {
      success: true,
      data: {
        status: account.status,
        syncStatus: account.syncStatus,
        syncProgress: account.syncProgress || 0,
        lastSyncAt: account.lastSyncAt,
        lastSyncError: account.lastSyncError,
        initialSyncCompleted: account.initialSyncCompleted || false,
        isFirstSync: !account.initialSyncCompleted,
        provider: account.provider,
        emailCount,
        folderCount,
      },
    };
  } catch (error) {
    console.error('❌ Failed to get sync status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cancel ongoing sync (marks account as idle)
 * Note: Inngest functions will continue to completion, but UI will show as idle
 */
export async function cancelSync(accountId: string, userId: string) {
  try {
    const account = await db.query.emailAccounts.findFirst({
      where: and(
        eq(emailAccounts.id, accountId),
        eq(emailAccounts.userId, userId)
      ),
    });

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    await db
      .update(emailAccounts)
      .set({
        syncStatus: 'idle',
        syncProgress: 0,
      } as any)
      .where(eq(emailAccounts.id, accountId));

    console.log(`⏹️ Sync cancelled for account ${accountId}`);

    return { success: true, message: 'Sync cancelled' };
  } catch (error) {
    console.error('❌ Failed to cancel sync:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
