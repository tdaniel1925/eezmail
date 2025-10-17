'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails, emailAccounts } from '@/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import type { Email } from '@/db/schema';

/**
 * Get all emails in a thread (optimized - only fetches needed fields)
 */
export async function getThreadEmails(threadId: string): Promise<{
  success: boolean;
  emails?: Email[];
  error?: string;
}> {
  try {
    if (!threadId) {
      return { success: false, error: 'Thread ID is required' };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Optimized: Only select the fields we need for the modal
    // Limit to 50 emails max to prevent slow queries on huge threads
    const threadEmails = await db
      .select({
        id: emails.id,
        accountId: emails.accountId,
        messageId: emails.messageId,
        threadId: emails.threadId,
        subject: emails.subject,
        snippet: emails.snippet,
        fromAddress: emails.fromAddress,
        toAddresses: emails.toAddresses,
        ccAddresses: emails.ccAddresses,
        bccAddresses: emails.bccAddresses,
        bodyText: emails.bodyText,
        bodyHtml: emails.bodyHtml,
        sentAt: emails.sentAt,
        receivedAt: emails.receivedAt,
        isRead: emails.isRead,
        isStarred: emails.isStarred,
        hasAttachments: emails.hasAttachments,
        aiSummary: emails.aiSummary,
        createdAt: emails.createdAt,
      })
      .from(emails)
      .innerJoin(emailAccounts, eq(emails.accountId, emailAccounts.id))
      .where(
        and(eq(emails.threadId, threadId), eq(emailAccounts.userId, user.id))
      )
      .orderBy(emails.sentAt)
      .limit(50);

    return { success: true, emails: threadEmails as Email[] };
  } catch (error) {
    console.error('Error fetching thread emails:', error);
    return { success: false, error: 'Failed to fetch thread emails' };
  }
}

/**
 * Get thread count for a specific threadId (optimized with SQL COUNT)
 */
export async function getThreadCount(threadId: string): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  try {
    if (!threadId) {
      return { success: true, count: 0 };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Optimized: Use SQL COUNT for fast counting
    const result = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(emails)
      .innerJoin(emailAccounts, eq(emails.accountId, emailAccounts.id))
      .where(
        and(eq(emails.threadId, threadId), eq(emailAccounts.userId, user.id))
      );

    return { success: true, count: result[0]?.count || 0 };
  } catch (error) {
    console.error('Error getting thread count:', error);
    return { success: false, error: 'Failed to get thread count' };
  }
}
