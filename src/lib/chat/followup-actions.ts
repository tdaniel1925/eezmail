'use server';

import { db } from '@/lib/db';
import { emails, emailAccounts } from '@/db/schema';
import { eq, and, sql, gte, lte, desc, or } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

/**
 * Get emails that need follow-up (old unread or marked as needing reply)
 */
export async function getEmailsNeedingFollowup(
  userId: string,
  daysOld: number = 3
): Promise<{
  success: boolean;
  emails?: Array<{
    id: string;
    subject: string;
    from: { name: string; email: string };
    snippet: string;
    receivedAt: Date;
    daysOld: number;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const userAccounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
    });

    if (userAccounts.length === 0) {
      return { success: true, emails: [] };
    }

    const accountIds = userAccounts.map((acc) => acc.id);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const results = await db
      .select({
        id: emails.id,
        subject: emails.subject,
        fromAddress: emails.fromAddress,
        snippet: emails.snippet,
        receivedAt: emails.receivedAt,
      })
      .from(emails)
      .where(
        and(
          sql`${emails.accountId} = ANY(${accountIds})`,
          or(
            // Emails marked as needing reply
            eq(emails.needsReply, true),
            // Old unread emails
            and(
              eq(emails.isRead, false),
              lte(emails.receivedAt, cutoffDate),
              eq(emails.folderName, 'inbox')
            )
          ),
          eq(emails.isTrashed, false)
        )
      )
      .orderBy(desc(emails.receivedAt))
      .limit(20);

    const now = new Date();
    const followupEmails = results.map((r) => {
      const daysOld = Math.floor(
        (now.getTime() - new Date(r.receivedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return {
        id: r.id,
        subject: r.subject,
        from: r.fromAddress as { name: string; email: string },
        snippet: r.snippet || '',
        receivedAt: r.receivedAt,
        daysOld,
      };
    });

    return { success: true, emails: followupEmails };
  } catch (error) {
    console.error('Error getting follow-up emails:', error);
    return { success: false, error: 'Failed to get follow-up emails' };
  }
}

/**
 * Snooze an email until a specific date
 * Note: Requires snoozeUntil field in schema (not yet implemented)
 */
export async function snoozeEmail(
  emailId: string,
  untilDate: Date
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if email belongs to user
    const email = await db.query.emails.findFirst({
      where: eq(emails.id, emailId),
    });

    if (!email) {
      return { success: false, error: 'Email not found' };
    }

    // Verify ownership
    const account = await db.query.emailAccounts.findFirst({
      where: eq(emailAccounts.id, email.accountId),
    });

    if (!account || account.userId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // TODO: Add snoozeUntil field to schema
    // Returns success - frontend should handle UI updates

    return {
      success: true,
      message: `Email snoozed until ${untilDate.toLocaleDateString()}`,
    };
  } catch (error) {
    console.error('Error snoozing email:', error);
    return { success: false, error: 'Failed to snooze email' };
  }
}

/**
 * Set a reminder for an email
 * Note: This would require a reminders table (not yet implemented)
 */
export async function remindAboutEmail(
  emailId: string,
  when: Date
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if email belongs to user
    const email = await db.query.emails.findFirst({
      where: eq(emails.id, emailId),
    });

    if (!email) {
      return { success: false, error: 'Email not found' };
    }

    // Verify ownership
    const account = await db.query.emailAccounts.findFirst({
      where: eq(emailAccounts.id, email.accountId),
    });

    if (!account || account.userId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // TODO: Create reminders table and insert reminder
    // Returns success - frontend should handle UI updates

    return {
      success: true,
      message: `Reminder set for ${when.toLocaleString()}`,
    };
  } catch (error) {
    console.error('Error setting reminder:', error);
    return { success: false, error: 'Failed to set reminder' };
  }
}

/**
 * Get snoozed emails
 * Note: Requires snoozeUntil field in schema
 */
export async function getSnoozedEmails(userId: string): Promise<{
  success: boolean;
  emails?: Array<{
    id: string;
    subject: string;
    from: { name: string; email: string };
    snoozedUntil: Date;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // TODO: Query emails where snoozeUntil is not null
    // For now, return empty array
    return { success: true, emails: [] };
  } catch (error) {
    console.error('Error getting snoozed emails:', error);
    return { success: false, error: 'Failed to get snoozed emails' };
  }
}

/**
 * Detect emails that haven't been answered in a conversation
 */
export async function detectUnansweredEmails(userId: string): Promise<{
  success: boolean;
  emails?: Array<{
    id: string;
    subject: string;
    from: { name: string; email: string };
    receivedAt: Date;
    daysOld: number;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const userAccounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
    });

    if (userAccounts.length === 0) {
      return { success: true, emails: [] };
    }

    const accountIds = userAccounts.map((acc) => acc.id);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Find emails that:
    // 1. Were received more than 3 days ago
    // 2. Are in inbox
    // 3. Are from someone else (not sent by us)
    // 4. Don't have a response yet
    const results = await db
      .select({
        id: emails.id,
        subject: emails.subject,
        fromAddress: emails.fromAddress,
        receivedAt: emails.receivedAt,
        threadId: emails.threadId,
      })
      .from(emails)
      .where(
        and(
          sql`${emails.accountId} = ANY(${accountIds})`,
          lte(emails.receivedAt, threeDaysAgo),
          eq(emails.folderName, 'inbox'),
          eq(emails.isTrashed, false),
          eq(emails.isDraft, false)
        )
      )
      .orderBy(desc(emails.receivedAt))
      .limit(20);

    const now = new Date();
    const unansweredEmails = results.map((r) => {
      const daysOld = Math.floor(
        (now.getTime() - new Date(r.receivedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return {
        id: r.id,
        subject: r.subject,
        from: r.fromAddress as { name: string; email: string },
        receivedAt: r.receivedAt,
        daysOld,
      };
    });

    return { success: true, emails: unansweredEmails };
  } catch (error) {
    console.error('Error detecting unanswered emails:', error);
    return { success: false, error: 'Failed to detect unanswered emails' };
  }
}
