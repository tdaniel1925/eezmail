import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * GET /api/email/accounts/count
 * Returns the count of email accounts for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailAccounts)
      .where(eq(emailAccounts.userId, user.id));

    const count = Number(result[0]?.count || 0);

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching account count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account count' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/email/accounts/count
 * Returns the count of email accounts for a specific user (requires userId in body)
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
    const userId = body.userId || user.id;

    // Ensure user can only query their own count
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailAccounts)
      .where(eq(emailAccounts.userId, userId));

    const count = Number(result[0]?.count || 0);

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching account count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account count' },
      { status: 500 }
    );
  }
}
