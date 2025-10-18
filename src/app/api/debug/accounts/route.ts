import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 DEBUG: Fetching accounts for user:', user.id);

    // Get all accounts for this user
    const accounts = await db.query.emailAccounts.findMany({
      where: (accounts, { eq }) => eq(accounts.userId, user.id),
      orderBy: (accounts, { desc }) => [desc(accounts.createdAt)],
    });

    console.log('📧 DEBUG: Found accounts:', accounts.length);
    console.log(
      '📧 DEBUG: Account details:',
      accounts.map((a) => ({
        id: a.id,
        email: a.emailAddress,
        provider: a.provider,
        status: a.status,
        createdAt: a.createdAt,
        displayName: a.displayName,
      }))
    );

    return NextResponse.json({
      success: true,
      userId: user.id,
      accountCount: accounts.length,
      accounts: accounts.map((a) => ({
        id: a.id,
        emailAddress: a.emailAddress,
        provider: a.provider,
        status: a.status,
        displayName: a.displayName,
        createdAt: a.createdAt,
        lastSyncAt: a.lastSyncAt,
        isDefault: a.isDefault,
      })),
    });
  } catch (error) {
    console.error('❌ DEBUG: Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts', details: error },
      { status: 500 }
    );
  }
}
