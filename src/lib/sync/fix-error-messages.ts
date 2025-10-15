/**
 * Fix Error Messages
 * Updates old "Forbidden" errors to show proper permission messages
 */

'use server';

import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

/**
 * Update old error messages to new user-friendly format
 */
export async function fixOldErrorMessages() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Find accounts with old "Forbidden" error
    const accounts = await db.query.emailAccounts.findMany({
      where: (accounts, { and, eq }) =>
        and(eq(accounts.userId, user.id), eq(accounts.status, 'error')),
    });

    let updated = 0;
    for (const account of accounts) {
      const errorMsg = account.lastSyncError?.toLowerCase() || '';

      // Check if it's a permission error
      if (
        errorMsg.includes('forbidden') ||
        errorMsg.includes('unauthorized') ||
        errorMsg.includes('access denied')
      ) {
        await db
          .update(emailAccounts)
          .set({
            lastSyncError:
              'Permission denied. Please reconnect your email account to grant proper access.',
            errorMessage:
              'Permission denied. Please reconnect your email account to grant proper access.',
          })
          .where(eq(emailAccounts.id, account.id));

        updated++;
      }
    }

    return {
      success: true,
      message: `Updated ${updated} account(s)`,
      updated,
    };
  } catch (error) {
    console.error('Error fixing error messages:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update',
    };
  }
}
