import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails, emailAccounts } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * GET /api/threads/[threadId]
 * Fetch all emails in a thread and their attachments
 * ✅ OPTIMIZED: Single query with JOIN to avoid N+1 problem
 */

// Note: Cannot use Edge Runtime due to Postgres driver dependency
// export const runtime = 'edge'; // ⚠️ Disabled - postgres requires Node.js runtime

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
      return NextResponse.json(
        { error: 'Thread ID required' },
        { status: 400 }
      );
    }

    console.log(`📧 [Thread Details] Fetching thread: ${threadId}`);

    // Get user's email accounts
    const userAccounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
    });

    if (userAccounts.length === 0) {
      return NextResponse.json(
        { error: 'No email accounts found' },
        { status: 404 }
      );
    }

    const accountIds = userAccounts.map((acc) => acc.id);

    // ✅ OPTIMIZED: Fetch all emails WITH attachments in ONE query (no N+1)
    const threadEmails = await db.query.emails.findMany({
      where: and(
        eq(emails.threadId, threadId),
        inArray(emails.accountId, accountIds)
      ),
      with: {
        attachments: true, // ✅ Include attachments in single query
      },
      orderBy: [emails.sentAt],
    });

    if (threadEmails.length === 0) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // ✅ Format response with attachments already included
    const emailsWithAttachments = threadEmails.map((email) => ({
      ...email,
      attachments: email.attachments || [],
    }));

    return NextResponse.json({
      success: true,
      emails: emailsWithAttachments,
      total: threadEmails.length,
    });
  } catch (error) {
    console.error('❌ [Thread Details] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread details' },
      { status: 500 }
    );
  }
}
