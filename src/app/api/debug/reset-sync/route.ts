import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resetSyncProgress } from '@/lib/sync/sync-controls';
import { startDualModeSync } from '@/lib/sync/sync-modes';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Debug endpoint to reset sync and force full re-sync
 * This clears the delta token to fetch ALL emails again
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's accounts
    const accounts = await db.query.emailAccounts.findMany({
      where: (accounts, { eq }) => eq(accounts.userId, user.id),
    });

    console.log(`🔄 Resetting sync for ${accounts.length} accounts...`);

    // Reset each account
    for (const account of accounts) {
      console.log(`🔄 Resetting account: ${account.emailAddress}`);

      // Reset sync progress and clear delta token
      await resetSyncProgress(account.id);

      // Also clear any error status
      await db
        .update(emailAccounts)
        .set({
          status: 'active',
          lastSyncError: null,
          consecutiveErrors: 0,
        } as Partial<typeof emailAccounts.$inferInsert>)
        .where(eq(emailAccounts.id, account.id));

      // Start fresh sync
      await startDualModeSync(account.id);
      console.log(`✅ Sync restarted for: ${account.emailAddress}`);
    }

    return NextResponse.json({
      success: true,
      message: `Reset and restarted sync for ${accounts.length} account(s)`,
      accounts: accounts.map((a) => a.emailAddress),
    });
  } catch (error) {
    console.error('❌ Error resetting sync:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to reset sync',
      },
      { status: 500 }
    );
  }
}



