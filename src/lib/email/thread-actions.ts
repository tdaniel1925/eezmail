'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails, emailAccounts, emailAttachments } from '@/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import type { Email } from '@/db/schema';

/**
 * Get all emails in a thread with attachments
 */
export async function getThreadEmails(threadId: string): Promise<{
  success: boolean;
  emails?: any[];
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

    // Fetch thread emails with basic fields
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

    // Fetch attachments for these emails
    const emailIds = threadEmails.map((e) => e.id);
    const attachmentsData = emailIds.length > 0
      ? await db
          .select()
          .from(emailAttachments)
          .where(inArray(emailAttachments.emailId, emailIds))
      : [];

    // Group attachments by email ID
    const attachmentsByEmail = attachmentsData.reduce((acc, att) => {
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

    return { success: true, emails: emailsWithAttachments };
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
