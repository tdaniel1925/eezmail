'use server';

import { inngest } from '@/inngest/client';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

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

    // 1. Validate account exists and belongs to user
    const account = await db.query.emailAccounts.findFirst({
      where: and(
        eq(emailAccounts.id, accountId),
        eq(emailAccounts.userId, userId)
      ),
    });

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // 2. Determine sync mode based on trigger
    // ALWAYS do initial sync for manual triggers until we get emails
    // This fixes the loop where incremental sync returns 0 emails
    const syncMode: SyncMode =
      trigger === 'manual' || !account.initialSyncCompleted
        ? 'initial'
        : 'incremental';

    console.log(
      `📊 Sync mode: ${syncMode} (trigger: ${trigger}, initialSyncCompleted: ${account.initialSyncCompleted})`
    );

    // 3. Check if sync is already running (prevent duplicate syncs)
    if (account.syncStatus === 'syncing') {
      console.log(`⚠️ Sync already in progress for account ${accountId}`);
      return {
        success: false,
        error:
          'Sync already in progress. Please wait for current sync to complete.',
      };
    }

    // 4. Mark as syncing
    await db
      .update(emailAccounts)
      .set({
        syncStatus: 'syncing',
        syncProgress: 0,
        updatedAt: new Date(),
      } as any)
      .where(eq(emailAccounts.id, accountId));

    console.log(`✅ Account marked as syncing`);

    // Safety timeout: Auto-reset if sync doesn't complete in 30 minutes
    // This prevents permanent "stuck syncing" state
    setTimeout(
      async () => {
        try {
          const checkAccount = await db.query.emailAccounts.findFirst({
            where: and(
              eq(emailAccounts.id, accountId),
              eq(emailAccounts.userId, userId)
            ),
          });

          if (checkAccount && checkAccount.syncStatus === 'syncing') {
            console.warn(
              `⚠️ Sync timeout detected for account ${accountId} - auto-resetting status`
            );
            console.warn(`   Last progress: ${checkAccount.syncProgress}%`);
            console.warn(`   Account: ${checkAccount.emailAddress}`);

            await db
              .update(emailAccounts)
              .set({
                syncStatus: 'idle',
                syncProgress: 0,
                status: 'active',
                lastSyncError:
                  'Sync timed out after 30 minutes. Please try syncing again.',
                lastSyncAt: new Date(),
              } as any)
              .where(eq(emailAccounts.id, accountId));

            console.log('✅ Sync status auto-reset due to timeout');
          }
        } catch (error) {
          console.error('❌ Error in safety timeout handler:', error);
          // Don't throw - this is a background safety check
        }
      },
      30 * 60 * 1000
    ); // 30 minutes

    // 5. Trigger appropriate Inngest function based on provider
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

    // 6. Send event to Inngest with all required data
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
