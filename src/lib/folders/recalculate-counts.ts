/**
 * Folder Count Recalculation Utility
 * Ensures folder counts are always accurate after sync operations
 */

'use server';

import { db } from '@/lib/db';
import { emailFolders, emails } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

/**
 * Recalculate accurate counts for all folders of an account
 * Should be called after email sync to ensure folder counts are up-to-date
 */
export async function recalculateFolderCounts(accountId: string): Promise<{
  success: boolean;
  foldersUpdated: number;
  error?: string;
}> {
  try {
    console.log('📊 Recalculating folder counts for account:', accountId);

    // Get all folders for this account
    const folders = await db
      .select()
      .from(emailFolders)
      .where(eq(emailFolders.accountId, accountId));

    console.log(`📁 Found ${folders.length} folders to update`);

    let foldersUpdated = 0;

    for (const folder of folders) {
      // Count total messages in this folder
      const totalResult = await db.execute(sql`
        SELECT COUNT(*)::int as count
        FROM emails
        WHERE account_id = ${accountId}
        AND folder_name = ${folder.name}
        AND is_trashed = FALSE
      `);

      const totalCount = (totalResult.rows[0] as any)?.count || 0;

      // Count unread messages in this folder
      const unreadResult = await db.execute(sql`
        SELECT COUNT(*)::int as count
        FROM emails
        WHERE account_id = ${accountId}
        AND folder_name = ${folder.name}
        AND is_read = FALSE
        AND is_trashed = FALSE
      `);

      const unreadCount = (unreadResult.rows[0] as any)?.count || 0;

      // Update folder counts
      await db
        .update(emailFolders)
        .set({
          messageCount: totalCount,
          unreadCount: unreadCount,
        })
        .where(eq(emailFolders.id, folder.id));

      console.log(
        `✅ Updated folder "${folder.name}": ${totalCount} total, ${unreadCount} unread`
      );
      foldersUpdated++;
    }

    console.log(`✅ Successfully updated ${foldersUpdated} folders`);

    return {
      success: true,
      foldersUpdated,
    };
  } catch (error) {
    console.error('❌ Error recalculating folder counts:', error);
    return {
      success: false,
      foldersUpdated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Recalculate counts for all folders of all accounts for the current user
 */
export async function recalculateAllFolderCounts(): Promise<{
  success: boolean;
  accountsUpdated: number;
  totalFoldersUpdated: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        accountsUpdated: 0,
        totalFoldersUpdated: 0,
        error: 'Unauthorized',
      };
    }

    console.log(
      '📊 Recalculating folder counts for all accounts of user:',
      user.id
    );

    // Get all email accounts for this user
    const accountsResult = await db.execute(sql`
      SELECT id FROM email_accounts WHERE user_id = ${user.id}
    `);

    const accountIds = accountsResult.rows.map((row: any) => row.id);
    console.log(`📧 Found ${accountIds.length} accounts`);

    let accountsUpdated = 0;
    let totalFoldersUpdated = 0;

    for (const accountId of accountIds) {
      const result = await recalculateFolderCounts(accountId);
      if (result.success) {
        accountsUpdated++;
        totalFoldersUpdated += result.foldersUpdated;
      }
    }

    console.log(
      `✅ Successfully updated ${accountsUpdated} accounts, ${totalFoldersUpdated} folders total`
    );

    return {
      success: true,
      accountsUpdated,
      totalFoldersUpdated,
    };
  } catch (error) {
    console.error('❌ Error recalculating all folder counts:', error);
    return {
      success: false,
      accountsUpdated: 0,
      totalFoldersUpdated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Recalculate counts for a specific folder
 */
export async function recalculateSingleFolderCount(
  accountId: string,
  folderName: string
): Promise<{
  success: boolean;
  totalCount: number;
  unreadCount: number;
  error?: string;
}> {
  try {
    console.log(
      `📊 Recalculating counts for folder "${folderName}" in account:`,
      accountId
    );

    // Count total messages in this folder
    const totalResult = await db.execute(sql`
      SELECT COUNT(*)::int as count
      FROM emails
      WHERE account_id = ${accountId}
      AND folder_name = ${folderName}
      AND is_trashed = FALSE
    `);

    const totalCount = (totalResult.rows[0] as any)?.count || 0;

    // Count unread messages in this folder
    const unreadResult = await db.execute(sql`
      SELECT COUNT(*)::int as count
      FROM emails
      WHERE account_id = ${accountId}
      AND folder_name = ${folderName}
      AND is_read = FALSE
      AND is_trashed = FALSE
    `);

    const unreadCount = (unreadResult.rows[0] as any)?.count || 0;

    // Get the folder record
    const folder = await db.query.emailFolders.findFirst({
      where: (folders, { and, eq }) =>
        and(eq(folders.accountId, accountId), eq(folders.name, folderName)),
    });

    if (folder) {
      // Update folder counts
      await db
        .update(emailFolders)
        .set({
          messageCount: totalCount,
          unreadCount: unreadCount,
        })
        .where(eq(emailFolders.id, folder.id));

      console.log(
        `✅ Updated folder "${folderName}": ${totalCount} total, ${unreadCount} unread`
      );
    } else {
      console.log(
        `⚠️ Folder "${folderName}" not found in database (may need to be created)`
      );
    }

    return {
      success: true,
      totalCount,
      unreadCount,
    };
  } catch (error) {
    console.error('❌ Error recalculating single folder count:', error);
    return {
      success: false,
      totalCount: 0,
      unreadCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
