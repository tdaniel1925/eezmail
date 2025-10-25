import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails, emailAccounts } from '@/db/schema';
import { eq, and, inArray, sql, desc } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/contacts/sender-emails
 * Fetch all emails from a specific sender
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const senderEmail = searchParams.get('senderEmail');
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = 20;

    console.log(
      `[Sender Emails API] Fetching emails for: ${senderEmail}, offset: ${offset}`
    );

    if (!senderEmail) {
      return NextResponse.json(
        { error: 'senderEmail parameter is required' },
        { status: 400 }
      );
    }

    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's email accounts
    const userAccounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
    });

    console.log(
      `[Sender Emails API] Found ${userAccounts.length} user account(s)`
    );

    if (userAccounts.length === 0) {
      return NextResponse.json({ emails: [], hasMore: false, total: 0 });
    }

    const accountIds = userAccounts.map((acc) => acc.id);

    // Query emails where fromAddress JSONB contains senderEmail
    // Using sql template for JSONB querying
    // The fromAddress field is a JSONB object with structure: { email: string, name?: string }
    const senderEmails = await db
      .select({
        id: emails.id,
        subject: emails.subject,
        snippet: emails.snippet,
        fromAddress: emails.fromAddress,
        toAddresses: emails.toAddresses,
        receivedAt: emails.receivedAt,
        sentAt: emails.sentAt,
        isRead: emails.isRead,
        isStarred: emails.isStarred,
        hasAttachments: emails.hasAttachments,
        folderName: emails.folderName,
      })
      .from(emails)
      .where(
        and(
          inArray(emails.accountId, accountIds),
          sql`LOWER(${emails.fromAddress}->>'email') = LOWER(${senderEmail})`,
          eq(emails.isTrashed, false)
        )
      )
      .orderBy(desc(emails.receivedAt))
      .limit(limit)
      .offset(offset);

    console.log(
      `[Sender Emails API] Found ${senderEmails.length} email(s) from ${senderEmail}`
    );

    return NextResponse.json({
      emails: senderEmails,
      hasMore: senderEmails.length === limit,
      total: senderEmails.length,
    });
  } catch (error) {
    console.error('[Sender Emails API] Error fetching sender emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sender emails' },
      { status: 500 }
    );
  }
}
