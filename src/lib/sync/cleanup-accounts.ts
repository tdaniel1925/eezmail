'use server';

import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

/**
 * Clean up all email accounts for the current user
 * This fixes immediate errors on the Email Accounts tab
 */
export async function cleanupEmailAccounts() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get accounts before deletion for logging
    const accounts = await db.query.emailAccounts.findMany({
      where: (accounts, { eq }) => eq(accounts.userId, user.id),
    });

    console.log(
      `🧹 Cleaning up ${accounts.length} email account(s) for user ${user.id}`
    );

    // Delete all email accounts for this user
    await db.delete(emailAccounts).where(eq(emailAccounts.userId, user.id));

    console.log(`✅ Cleaned up ${accounts.length} email account(s)`);

    return {
      success: true,
      message: `Cleaned up ${accounts.length} email account(s)`,
      deletedCount: accounts.length,
    };
  } catch (error) {
    console.error('Error cleaning up email accounts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cleanup',
    };
  }
}
