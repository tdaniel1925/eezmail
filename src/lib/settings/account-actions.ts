'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Get user's email accounts
 */
export async function getUserEmailAccounts() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    console.log('🔍 Fetching email accounts for user:', user.id);

    const accounts = await db.query.emailAccounts.findMany({
      where: (accounts, { eq }) => eq(accounts.userId, user.id),
      orderBy: (accounts, { desc }) => [desc(accounts.createdAt)],
    });

    console.log(
      '📧 Found accounts:',
      accounts.length,
      accounts.map((a) => ({
        id: a.id,
        email: a.emailAddress,
        status: a.status,
      }))
    );

    return { success: true, accounts };
  } catch (error) {
    console.error('Error fetching email accounts:', error);
    return { success: false, error: 'Failed to fetch accounts' };
  }
}
