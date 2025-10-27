/**
 * Smart Defaults Service
 * Automatically configures standard folders for new email accounts
 */

import { db } from '@/lib/db';
import { emailFolders, emailAccounts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { detectFolderType } from './folder-mapper';
import { triggerSync } from '../sync/sync-orchestrator';

/**
 * Standard folders to auto-enable for all accounts
 */
const STANDARD_FOLDERS = [
  'inbox',
  'sent',
  'drafts',
  'junk',
  'outbox',
  'deleted',
] as const;

/**
 * Apply smart folder defaults for an account
 * - Detects all folders from provider
 * - Automatically enables standard folders
 * - Triggers initial sync
 */
export async function applySmartDefaults(
  accountId: string,
  userId: string
): Promise<{ success: boolean; foldersEnabled: number; error?: string }> {
  try {
    console.log(`📁 Applying smart defaults for account ${accountId}`);

    // Get account details
    const account = await db.query.emailAccounts.findFirst({
      where: and(
        eq(emailAccounts.id, accountId),
        eq(emailAccounts.userId, userId)
      ),
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Fetch existing folders for this account
    const folders = await db
      .select()
      .from(emailFolders)
      .where(eq(emailFolders.accountId, accountId));

    if (folders.length === 0) {
      console.log('⚠️ No folders found yet. They will be created during sync.');
      // Folders will be created during sync, so just trigger it
      await triggerSync({
        accountId,
        userId,
        trigger: 'smart_defaults',
      });

      return {
        success: true,
        foldersEnabled: 0, // Will be determined during sync
      };
    }

    // Enable sync for standard folders
    let enabledCount = 0;

    for (const folder of folders) {
      const folderType =
        folder.folderType || detectFolderType(folder.name, account.provider);

      if (STANDARD_FOLDERS.includes(folderType as any)) {
        await db
          .update(emailFolders)
          .set({
            syncEnabled: true,
            folderType: folderType as any,
          })
          .where(eq(emailFolders.id, folder.id));

        enabledCount++;
      }
    }

    console.log(`✅ Enabled ${enabledCount} standard folders`);

    // Trigger initial sync
    await triggerSync({
      accountId,
      userId,
      trigger: 'smart_defaults',
    });

    return {
      success: true,
      foldersEnabled: enabledCount,
    };
  } catch (error) {
    console.error('❌ Smart defaults error:', error);
    return {
      success: false,
      foldersEnabled: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Detect folder count for an account
 * Used to estimate how many folders will be synced
 */
export async function detectFolderCount(accountId: string): Promise<number> {
  const folders = await db
    .select()
    .from(emailFolders)
    .where(eq(emailFolders.accountId, accountId));

  return folders.length;
}

/**
 * Get list of enabled folders for an account
 */
export async function getEnabledFolders(accountId: string) {
  return await db
    .select()
    .from(emailFolders)
    .where(
      and(
        eq(emailFolders.accountId, accountId),
        eq(emailFolders.syncEnabled, true)
      )
    );
}
