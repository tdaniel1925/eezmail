import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountId } = await params;

    // Fetch account
    const [account] = await db
      .select()
      .from(emailAccounts)
      .where(
        and(eq(emailAccounts.id, accountId), eq(emailAccounts.userId, user.id))
      )
      .limit(1);

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Return account data (excluding sensitive password field)
    return NextResponse.json({
      ...account,
      accessToken: undefined, // Don't send password to client
      smtpPassword: undefined,
    });
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account' },
      { status: 500 }
    );
  }
}


