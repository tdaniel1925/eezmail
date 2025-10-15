/**
 * Unified Inbox API Route
 * Returns emails from all accounts or filtered by account
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get all user's email accounts
    const userAccounts = await db.query.emailAccounts.findMany({
      where: (accounts, { eq }) => eq(accounts.userId, user.id),
    });

    const accountIds = userAccounts.map((a) => a.id);

    if (accountIds.length === 0) {
      return NextResponse.json({ emails: [] });
    }

    // Build query
    let query;
    if (accountId && accountId !== 'all') {
      // Filter by specific account
      query = db
        .select()
        .from(emails)
        .where(
          and(
            eq(emails.accountId, accountId),
            eq(emails.emailCategory, 'inbox')
          )
        )
        .orderBy(desc(emails.receivedAt))
        .limit(limit);
    } else {
      // All accounts
      query = db
        .select()
        .from(emails)
        .where(
          and(
            inArray(emails.accountId, accountIds),
            eq(emails.emailCategory, 'inbox')
          )
        )
        .orderBy(desc(emails.receivedAt))
        .limit(limit);
    }

    const unifiedEmails = await query;

    return NextResponse.json({ emails: unifiedEmails });
  } catch (error) {
    console.error('Error fetching unified inbox:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unified inbox' },
      { status: 500 }
    );
  }
}

