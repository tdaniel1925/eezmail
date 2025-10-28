import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { emailAccounts } from '@/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get errors from email_accounts table
    const accountsWithErrors = await db
      .select({
        id: emailAccounts.id,
        emailAddress: emailAccounts.emailAddress,
        errorMessage: emailAccounts.errorMessage,
        lastSyncAt: emailAccounts.lastSyncAt,
        status: emailAccounts.status,
      })
      .from(emailAccounts)
      .where(
        and(
          eq(emailAccounts.userId, user.id),
          isNotNull(emailAccounts.errorMessage)
        )
      );

    const errors = accountsWithErrors.map((account) => ({
      id: account.id,
      timestamp: account.lastSyncAt || new Date(),
      accountId: account.id,
      accountEmail: account.emailAddress || 'Unknown',
      errorType: account.status === 'error' ? 'sync_error' : 'unknown',
      message: account.errorMessage || 'Unknown error',
      resolved: account.status !== 'error',
      resolvedAt: account.status !== 'error' ? new Date() : undefined,
    }));

    return NextResponse.json({
      success: true,
      errors,
    });
  } catch (error) {
    console.error('[ERROR_HISTORY] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch error history' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clear error messages from accounts
    await db
      .update(emailAccounts)
      .set({ errorMessage: null })
      .where(eq(emailAccounts.userId, user.id));

    return NextResponse.json({
      success: true,
      message: 'Error history cleared',
    });
  } catch (error) {
    console.error('[ERROR_HISTORY] Error:', error);
    return NextResponse.json(
      { error: 'Failed to clear error history' },
      { status: 500 }
    );
  }
}

