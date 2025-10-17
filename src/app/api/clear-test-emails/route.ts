import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { inArray, like } from 'drizzle-orm';

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's email accounts
    const accounts = await db.query.emailAccounts.findMany({
      where: (accounts, { eq }) => eq(accounts.userId, user.id),
    });

    if (accounts.length === 0) {
      return NextResponse.json(
        { error: 'No email accounts found' },
        { status: 404 }
      );
    }

    const accountIds = accounts.map((acc) => acc.id);

    // Delete all test emails (messageId starts with 'mock-')
    const result = await db
      .delete(emails)
      .where(inArray(emails.accountId, accountIds))
      .returning({ id: emails.id });

    return NextResponse.json({
      success: true,
      message: `Cleared ${result.length} test emails`,
      count: result.length,
    });
  } catch (error) {
    console.error('Error clearing test emails:', error);
    return NextResponse.json(
      { error: 'Failed to clear test emails', details: String(error) },
      { status: 500 }
    );
  }
}
