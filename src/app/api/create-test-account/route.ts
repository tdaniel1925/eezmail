import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if test account already exists
    const existing = await db.query.emailAccounts.findFirst({
      where: (accounts, { and, eq }) =>
        and(
          eq(accounts.userId, user.id),
          eq(accounts.emailAddress, 'test@example.com')
        ),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Test account already exists' },
        { status: 400 }
      );
    }

    // Create test email account
    await db.insert(emailAccounts).values({
      userId: user.id,
      emailAddress: 'test@example.com',
      displayName: 'Test Account',
      provider: 'custom',
      authType: 'password',
      status: 'active',
      accessToken: 'test-token',
      refreshToken: null,
      tokenExpiresAt: null,
      nylasGrantId: null,
      lastSyncAt: new Date(),
      isDefault: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Test account created successfully!',
      account: 'test@example.com',
    });
  } catch (error) {
    console.error('Error creating test account:', error);
    return NextResponse.json(
      { error: 'Failed to create test account', details: String(error) },
      { status: 500 }
    );
  }
}
