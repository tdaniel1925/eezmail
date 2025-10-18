import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails, emailAccounts } from '@/db/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for all mail request
const allMailSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(100),
  offset: z.number().min(0).optional().default(0),
});

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Validate parameters
    const validatedData = allMailSchema.parse({ limit, offset });

    console.log(`📧 Fetching all mail for user:`, user.id);

    // Get user's email accounts
    const userAccounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
    });

    if (userAccounts.length === 0) {
      console.log('📧 No email accounts found for user');
      return NextResponse.json({
        success: true,
        emails: [],
        total: 0,
        hasMore: false,
      });
    }

    const accountIds = userAccounts.map((account) => account.id);
    console.log('📧 Found accounts:', accountIds);

    // Get all emails from all accounts (not trashed)
    const allEmails = await db
      .select()
      .from(emails)
      .where(
        and(inArray(emails.accountId, accountIds), eq(emails.isTrashed, false))
      )
      .orderBy(desc(emails.receivedAt))
      .limit(validatedData.limit)
      .offset(validatedData.offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: emails.id })
      .from(emails)
      .where(
        and(inArray(emails.accountId, accountIds), eq(emails.isTrashed, false))
      );

    const total = totalCount.length;
    const hasMore = validatedData.offset + validatedData.limit < total;

    console.log(`📧 Found all mail emails:`, allEmails.length);

    return NextResponse.json({
      success: true,
      emails: allEmails,
      total,
      hasMore,
      limit: validatedData.limit,
      offset: validatedData.offset,
    });
  } catch (error) {
    console.error('❌ Error fetching all mail:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch all mail' },
      { status: 500 }
    );
  }
}
