import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailThreads, emails, emailAccounts } from '@/db/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { z } from 'zod';

/**
 * GET /api/email/threads
 * Fetch email threads (grouped conversations) for inbox
 * Returns threads with latest message preview and metadata
 */

const threadsSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(25),
  offset: z.number().min(0).optional().default(0),
  folder: z.string().optional().default('inbox'),
  accountId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
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
    const folder = url.searchParams.get('folder') || 'inbox';
    const accountId = url.searchParams.get('accountId') || undefined;

    const validatedData = threadsSchema.parse({ limit, offset, folder, accountId });

    console.log(`📧 [Threads API] Fetching threads for user: ${user.id}`);

    // Get user's email accounts
    const userAccounts = await db.query.emailAccounts.findMany({
      where: accountId 
        ? and(
            eq(emailAccounts.userId, user.id),
            eq(emailAccounts.id, accountId)
          )
        : eq(emailAccounts.userId, user.id),
    });

    if (userAccounts.length === 0) {
      return NextResponse.json({
        success: true,
        threads: [],
        total: 0,
        hasMore: false,
      });
    }

    const accountIds = userAccounts.map((acc) => acc.id);

    // Fetch threads for these accounts
    // Note: For now, we'll query emails directly and group by threadId
    // In the future, we should populate and query the email_threads table
    const threadedEmails = await db
      .select({
        threadId: emails.threadId,
        latestSubject: emails.subject,
        latestSnippet: emails.snippet,
        latestFrom: emails.fromAddress,
        latestReceivedAt: emails.receivedAt,
        messageCount: emails.id, // We'll count these
        unreadCount: emails.isRead,
        hasAttachments: emails.hasAttachments,
        isStarred: emails.isStarred,
        emailCategory: emails.emailCategory,
        accountId: emails.accountId,
      })
      .from(emails)
      .where(
        and(
          inArray(emails.accountId, accountIds),
          eq(emails.emailCategory, folder as any)
        )
      )
      .orderBy(desc(emails.receivedAt));

    // Group emails by threadId
    const threadsMap = new Map();

    for (const email of threadedEmails) {
      if (!email.threadId) continue;

      if (!threadsMap.has(email.threadId)) {
        threadsMap.set(email.threadId, {
          threadId: email.threadId,
          subject: email.latestSubject,
          snippet: email.latestSnippet,
          participants: [email.latestFrom],
          messageCount: 1,
          unreadCount: email.unreadCount === false ? 1 : 0,
          hasAttachments: email.hasAttachments,
          isStarred: email.isStarred,
          latestMessageAt: email.latestReceivedAt,
          firstMessageAt: email.latestReceivedAt,
          accountId: email.accountId,
          emails: [email],
        });
      } else {
        const thread = threadsMap.get(email.threadId);
        thread.messageCount++;
        if (!email.unreadCount) thread.unreadCount++;
        if (email.hasAttachments) thread.hasAttachments = true;
        if (email.isStarred) thread.isStarred = true;
        
        // Add participant if not already there
        const participantExists = thread.participants.some(
          (p: any) => p?.email === email.latestFrom?.email
        );
        if (!participantExists) {
          thread.participants.push(email.latestFrom);
        }

        // Update timestamps
        const emailDate = new Date(email.latestReceivedAt);
        const latestDate = new Date(thread.latestMessageAt);
        const firstDate = new Date(thread.firstMessageAt);

        if (emailDate > latestDate) {
          thread.latestMessageAt = email.latestReceivedAt;
          thread.subject = email.latestSubject;
          thread.snippet = email.latestSnippet;
        }
        if (emailDate < firstDate) {
          thread.firstMessageAt = email.latestReceivedAt;
        }

        thread.emails.push(email);
      }
    }

    // Convert map to array and sort by latest message
    const threads = Array.from(threadsMap.values())
      .sort((a, b) => {
        const aDate = new Date(a.latestMessageAt).getTime();
        const bDate = new Date(b.latestMessageAt).getTime();
        return bDate - aDate;
      })
      .slice(offset, offset + limit);

    const total = threadsMap.size;
    const hasMore = offset + limit < total;

    console.log(`📧 [Threads API] Found ${threads.length} threads (${total} total)`);

    return NextResponse.json({
      success: true,
      threads: threads.map((t) => ({
        threadId: t.threadId,
        subject: t.subject,
        snippet: t.snippet,
        participants: t.participants,
        messageCount: t.messageCount,
        unreadCount: t.unreadCount,
        hasAttachments: t.hasAttachments,
        isStarred: t.isStarred,
        latestMessageAt: t.latestMessageAt,
        firstMessageAt: t.firstMessageAt,
        accountId: t.accountId,
      })),
      total,
      hasMore,
      offset,
      limit,
    });
  } catch (error) {
    console.error('❌ [Threads API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    );
  }
}

