import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Reset stuck sync status and trigger fresh sync
 * POST /api/email/reset-sync
 * Body: { accountId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Resetting sync status for account: ${accountId}`);

    // Reset sync status to idle
    await db
      .update(emailAccounts)
      .set({
        syncStatus: 'idle',
        syncProgress: 0,
        lastSyncError: null,
        updatedAt: new Date(),
      } as any)
      .where(
        and(eq(emailAccounts.id, accountId), eq(emailAccounts.userId, user.id))
      );

    console.log(`✅ Sync status reset successfully`);

    return NextResponse.json({
      success: true,
      message: 'Sync status reset. You can now trigger a new sync.',
    });
  } catch (error) {
    console.error('❌ Error resetting sync status:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to reset sync status',
      },
      { status: 500 }
    );
  }
}
