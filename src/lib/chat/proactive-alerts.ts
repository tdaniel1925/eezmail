'use server';

import { db } from '@/lib/db';
import { emails, emailAccounts } from '@/db/schema';
import { eq, and, sql, gte, or, desc } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

/**
 * Get urgent emails that need immediate attention
 */
export async function getUrgentEmails(userId: string): Promise<{
  success: boolean;
  emails?: Array<{
    id: string;
    subject: string;
    from: { name: string; email: string };
    snippet: string;
    receivedAt: Date;
    urgencyReason: string;
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
    const urgentEmails: Array<{
      id: string;
      subject: string;
      from: { name: string; email: string };
      snippet: string;
      receivedAt: Date;
      urgencyReason: string;
    }> = [];

    // Urgent keywords
    const urgentKeywords = [
      'urgent',
      'asap',
      'immediate',
      'emergency',
      'critical',
      'important',
      'time-sensitive',
      'deadline',
    ];

    // Build urgency conditions
    const keywordConditions = urgentKeywords.map((keyword) =>
      or(
        sql`${emails.subject} ILIKE ${`%${keyword}%`}`,
        sql`${emails.bodyText} ILIKE ${`%${keyword}%`}`
      )
    );

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
          eq(emails.isRead, false),
          eq(emails.isTrashed, false),
          or(...keywordConditions)
        )
      )
      .orderBy(desc(emails.receivedAt))
      .limit(10);

    results.forEach((r) => {
      // Determine which keyword triggered it
      const subjectLower = r.subject.toLowerCase();
      const urgentKeyword = urgentKeywords.find((k) =>
        subjectLower.includes(k)
      );

      urgentEmails.push({
        id: r.id,
        subject: r.subject,
        from: r.fromAddress as { name: string; email: string },
        snippet: r.snippet || '',
        receivedAt: r.receivedAt,
        urgencyReason: urgentKeyword
          ? `Contains "${urgentKeyword}"`
          : 'Marked as urgent',
      });
    });

    return { success: true, emails: urgentEmails };
  } catch (error) {
    console.error('Error getting urgent emails:', error);
    return { success: false, error: 'Failed to get urgent emails' };
  }
}

/**
 * Check for emails from VIP senders
 */
export async function checkForVIPEmails(
  userId: string,
  vipList: string[]
): Promise<{
  success: boolean;
  emails?: Array<{
    id: string;
    subject: string;
    from: { name: string; email: string };
    receivedAt: Date;
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

    // Normalize VIP emails
    const normalizedVIPs = vipList.map((email) => email.toLowerCase().trim());

    // Build conditions for VIP senders
    const vipConditions = normalizedVIPs.map(
      (vipEmail) => sql`${emails.fromAddress}->>'email' ILIKE ${vipEmail}`
    );

    const results = await db
      .select({
        id: emails.id,
        subject: emails.subject,
        fromAddress: emails.fromAddress,
        receivedAt: emails.receivedAt,
      })
      .from(emails)
      .where(
        and(
          sql`${emails.accountId} = ANY(${accountIds})`,
          eq(emails.isRead, false),
          eq(emails.isTrashed, false),
          or(...vipConditions)
        )
      )
      .orderBy(desc(emails.receivedAt))
      .limit(20);

    const vipEmails = results.map((r) => ({
      id: r.id,
      subject: r.subject,
      from: r.fromAddress as { name: string; email: string },
      receivedAt: r.receivedAt,
    }));

    return { success: true, emails: vipEmails };
  } catch (error) {
    console.error('Error checking VIP emails:', error);
    return { success: false, error: 'Failed to check VIP emails' };
  }
}

/**
 * Detect emails with deadlines
 */
export async function detectDeadlineEmails(userId: string): Promise<{
  success: boolean;
  emails?: Array<{
    id: string;
    subject: string;
    from: { name: string; email: string };
    snippet: string;
    receivedAt: Date;
    detectedDeadline?: string;
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

    // Deadline keywords
    const deadlineKeywords = [
      'deadline',
      'due date',
      'due by',
      'expires',
      'by friday',
      'by monday',
      'by tomorrow',
      'by end of',
    ];

    const keywordConditions = deadlineKeywords.map((keyword) =>
      or(
        sql`${emails.subject} ILIKE ${`%${keyword}%`}`,
        sql`${emails.bodyText} ILIKE ${`%${keyword}%`}`
      )
    );

    const results = await db
      .select({
        id: emails.id,
        subject: emails.subject,
        fromAddress: emails.fromAddress,
        snippet: emails.snippet,
        receivedAt: emails.receivedAt,
        bodyText: emails.bodyText,
      })
      .from(emails)
      .where(
        and(
          sql`${emails.accountId} = ANY(${accountIds})`,
          eq(emails.isRead, false),
          eq(emails.isTrashed, false),
          or(...keywordConditions)
        )
      )
      .orderBy(desc(emails.receivedAt))
      .limit(10);

    const deadlineEmails = results.map((r) => {
      // Try to extract deadline from text
      const textToSearch = `${r.subject} ${r.bodyText || ''}`.toLowerCase();
      const detectedKeyword = deadlineKeywords.find((k) =>
        textToSearch.includes(k)
      );

      return {
        id: r.id,
        subject: r.subject,
        from: r.fromAddress as { name: string; email: string },
        snippet: r.snippet || '',
        receivedAt: r.receivedAt,
        detectedDeadline: detectedKeyword
          ? `Mentions "${detectedKeyword}"`
          : undefined,
      };
    });

    return { success: true, emails: deadlineEmails };
  } catch (error) {
    console.error('Error detecting deadline emails:', error);
    return { success: false, error: 'Failed to detect deadline emails' };
  }
}

/**
 * Alert on important changes (e.g., order confirmations, shipping updates)
 */
export async function alertOnImportantChanges(userId: string): Promise<{
  success: boolean;
  alerts?: Array<{
    id: string;
    subject: string;
    from: { name: string; email: string };
    receivedAt: Date;
    alertType: string;
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
      return { success: true, alerts: [] };
    }

    const accountIds = userAccounts.map((acc) => acc.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Keywords for important changes
    const changeKeywords = [
      'order confirmation',
      'shipped',
      'delivered',
      'invoice',
      'receipt',
      'payment received',
      'password reset',
      'security alert',
      'account activity',
    ];

    const keywordConditions = changeKeywords.map((keyword) =>
      or(
        sql`${emails.subject} ILIKE ${`%${keyword}%`}`,
        sql`${emails.bodyText} ILIKE ${`%${keyword}%`}`
      )
    );

    const results = await db
      .select({
        id: emails.id,
        subject: emails.subject,
        fromAddress: emails.fromAddress,
        receivedAt: emails.receivedAt,
      })
      .from(emails)
      .where(
        and(
          sql`${emails.accountId} = ANY(${accountIds})`,
          gte(emails.receivedAt, today),
          eq(emails.isTrashed, false),
          or(...keywordConditions)
        )
      )
      .orderBy(desc(emails.receivedAt))
      .limit(10);

    const alerts = results.map((r) => {
      const subjectLower = r.subject.toLowerCase();
      let alertType = 'important_change';

      if (subjectLower.includes('order') || subjectLower.includes('shipped')) {
        alertType = 'order_update';
      } else if (
        subjectLower.includes('payment') ||
        subjectLower.includes('invoice')
      ) {
        alertType = 'payment';
      } else if (
        subjectLower.includes('security') ||
        subjectLower.includes('password')
      ) {
        alertType = 'security';
      }

      return {
        id: r.id,
        subject: r.subject,
        from: r.fromAddress as { name: string; email: string },
        receivedAt: r.receivedAt,
        alertType,
      };
    });

    return { success: true, alerts };
  } catch (error) {
    console.error('Error detecting important changes:', error);
    return { success: false, error: 'Failed to detect important changes' };
  }
}

/**
 * Scan for emails requiring action
 */
export async function scanForActionRequired(userId: string): Promise<{
  success: boolean;
  emails?: Array<{
    id: string;
    subject: string;
    from: { name: string; email: string };
    snippet: string;
    receivedAt: Date;
    actionType: string;
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

    // Action keywords
    const actionKeywords = [
      'please review',
      'need your approval',
      'awaiting your response',
      'action required',
      'please confirm',
      'please respond',
      'respond by',
      'rsvp',
    ];

    const keywordConditions = actionKeywords.map((keyword) =>
      or(
        sql`${emails.subject} ILIKE ${`%${keyword}%`}`,
        sql`${emails.bodyText} ILIKE ${`%${keyword}%`}`
      )
    );

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
          eq(emails.isRead, false),
          eq(emails.isTrashed, false),
          or(...keywordConditions)
        )
      )
      .orderBy(desc(emails.receivedAt))
      .limit(15);

    const actionEmails = results.map((r) => {
      const textLower = r.subject.toLowerCase();
      let actionType = 'response_needed';

      if (textLower.includes('review') || textLower.includes('approval')) {
        actionType = 'review_required';
      } else if (textLower.includes('confirm') || textLower.includes('rsvp')) {
        actionType = 'confirmation_needed';
      }

      return {
        id: r.id,
        subject: r.subject,
        from: r.fromAddress as { name: string; email: string },
        snippet: r.snippet || '',
        receivedAt: r.receivedAt,
        actionType,
      };
    });

    return { success: true, emails: actionEmails };
  } catch (error) {
    console.error('Error scanning for action required:', error);
    return { success: false, error: 'Failed to scan for action required' };
  }
}
