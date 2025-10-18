import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails, emailAccounts } from '@/db/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for inbox emails request
const inboxEmailSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(25),
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
    const limit = parseInt(url.searchParams.get('limit') || '25');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Validate parameters
    const validatedData = inboxEmailSchema.parse({ limit, offset });

    console.log(`📧 Fetching inbox emails for user:`, user.id);

    // Get user's email accounts
    const userAccounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
    });

    console.log(`📧 Found ${userAccounts.length} email accounts for user`);

    if (userAccounts.length === 0) {
      console.log('📧 No email accounts found for user');
      return NextResponse.json({
        success: true,
        emails: [],
        total: 0,
        hasMore: false,
        message:
          'No email accounts found. Please connect an email account first.',
      });
    }

    const accountIds = userAccounts.map((account) => account.id);
    console.log('📧 Found accounts:', accountIds);

    // Check if there are any emails at all for these accounts
    const allEmailsCount = await db
      .select({ count: emails.id })
      .from(emails)
      .where(inArray(emails.accountId, accountIds));

    console.log(
      `📧 Total emails in database for user accounts: ${allEmailsCount.length}`
    );

    // Get inbox emails
    const inboxEmails = await db
      .select()
      .from(emails)
      .where(
        and(
          inArray(emails.accountId, accountIds),
          eq(emails.emailCategory, 'inbox')
        )
      )
      .orderBy(desc(emails.receivedAt))
      .limit(validatedData.limit)
      .offset(validatedData.offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: emails.id })
      .from(emails)
      .where(
        and(
          inArray(emails.accountId, accountIds),
          eq(emails.emailCategory, 'inbox')
        )
      );

    const total = totalCount.length;
    const hasMore = validatedData.offset + validatedData.limit < total;

    console.log(`📧 Found inbox emails:`, inboxEmails.length);

    // If no inbox emails found, try to get any emails from these accounts
    let finalEmails = inboxEmails;
    if (inboxEmails.length === 0) {
      console.log('📧 No inbox emails found, checking for any emails...');
      const anyEmails = await db
        .select()
        .from(emails)
        .where(inArray(emails.accountId, accountIds))
        .orderBy(desc(emails.receivedAt))
        .limit(validatedData.limit)
        .offset(validatedData.offset);

      console.log(`📧 Found ${anyEmails.length} emails with any category`);
      finalEmails = anyEmails;
    }

    return NextResponse.json({
      success: true,
      emails: finalEmails,
      total,
      hasMore,
      limit: validatedData.limit,
      offset: validatedData.offset,
      debug: {
        accountCount: userAccounts.length,
        totalEmailsInDb: allEmailsCount.length,
        inboxEmailsFound: inboxEmails.length,
        finalEmailsReturned: finalEmails.length,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching inbox emails:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch inbox emails' },
      { status: 500 }
    );
  }
}
