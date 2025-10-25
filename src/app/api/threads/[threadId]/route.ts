import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails, emailAccounts, emailAttachments } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * GET /api/threads/[threadId]
 * Fetch all emails in a thread and their attachments
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threadId } = await params;

    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID required' }, { status: 400 });
    }

    console.log(`📧 [Thread Details] Fetching thread: ${threadId}`);

    // Get user's email accounts
    const userAccounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
    });

    if (userAccounts.length === 0) {
      return NextResponse.json({ error: 'No email accounts found' }, { status: 404 });
    }

    const accountIds = userAccounts.map((acc) => acc.id);

    // Fetch all emails in this thread
    const threadEmails = await db
      .select()
      .from(emails)
      .where(
        and(
          eq(emails.threadId, threadId),
          inArray(emails.accountId, accountIds)
        )
      )
      .orderBy(emails.sentAt);

    if (threadEmails.length === 0) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Fetch attachments for all emails in thread
    const emailIds = threadEmails.map((e) => e.id);
    const attachments = await db
      .select()
      .from(emailAttachments)
      .where(inArray(emailAttachments.emailId, emailIds));

    // Group attachments by email ID
    const attachmentsByEmail = attachments.reduce((acc, att) => {
      if (!acc[att.emailId]) {
        acc[att.emailId] = [];
      }
      acc[att.emailId].push(att);
      return acc;
    }, {} as Record<string, any[]>);

    // Add attachments to emails
    const emailsWithAttachments = threadEmails.map((email) => ({
      ...email,
      attachments: attachmentsByEmail[email.id] || [],
    }));

    console.log(`✅ [Thread Details] Found ${threadEmails.length} emails in thread`);

    return NextResponse.json({
      success: true,
      thread: {
        threadId,
        subject: threadEmails[0].subject,
        messageCount: threadEmails.length,
        emails: emailsWithAttachments,
      },
    });
  } catch (error) {
    console.error('❌ [Thread Details Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread details' },
      { status: 500 }
    );
  }
}

