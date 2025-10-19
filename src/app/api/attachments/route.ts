import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAttachments, emails, emailAccounts } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's email accounts
    const accounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
    });

    if (accounts.length === 0) {
      return NextResponse.json({
        success: true,
        attachments: [],
        total: 0,
      });
    }

    const accountIds = accounts.map((acc) => acc.id);

    // Get all emails for user's accounts
    const userEmails = await db.query.emails.findMany({
      where: inArray(emails.accountId, accountIds),
      columns: { id: true },
    });

    if (userEmails.length === 0) {
      return NextResponse.json({
        success: true,
        attachments: [],
        total: 0,
      });
    }

    const emailIds = userEmails.map((e) => e.id);

    // Get all attachments for those emails
    const attachments = await db.query.emailAttachments.findMany({
      where: inArray(emailAttachments.emailId, emailIds),
    });

    return NextResponse.json({
      success: true,
      attachments,
      total: attachments.length,
    });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attachments' },
      { status: 500 }
    );
  }
}
