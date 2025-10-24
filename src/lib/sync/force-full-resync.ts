/**
 * Force Full Resync
 * Clears all delta links and forces a complete re-sync of all emails
 */

'use server';

import { db } from '@/lib/db';
import { emailFolders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

/**
 * Clear all delta links for an account to force full resync
 */
export async function clearDeltaLinksAndResync(accountId: string): Promise<{
  success: boolean;
  message: string;
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
        message: 'Unauthorized',
        error: 'User not authenticated',
      };
    }

    console.log('🔄 Clearing delta links for full resync:', accountId);

    // Clear all sync cursors (delta links) for this account's folders
    await db
      .update(emailFolders)
      .set({
        syncCursor: null,
      })
      .where(eq(emailFolders.accountId, accountId));

    console.log('✅ Delta links cleared - next sync will be a FULL sync');

    return {
      success: true,
      message:
        'Delta links cleared successfully. Next sync will fetch ALL emails from scratch.',
    };
  } catch (error) {
    console.error('❌ Error clearing delta links:', error);
    return {
      success: false,
      message: 'Failed to clear delta links',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
