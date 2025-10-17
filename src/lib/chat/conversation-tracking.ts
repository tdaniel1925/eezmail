'use server';

import { db } from '@/lib/db';
import { emails, emailAccounts } from '@/db/schema';
import { eq, and, sql, or, desc, gte } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

/**
 * Get conversation history with a specific person
 */
export async function getConversationHistory(
  userId: string,
  personEmail: string,
  days: number = 90
): Promise<{
  success: boolean;
  emails?: Array<{
    id: string;
    subject: string;
    snippet: string;
    receivedAt: Date;
    isFromThem: boolean;
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
    const userEmails = userAccounts.map((acc) =>
      acc.emailAddress.toLowerCase()
    );
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const normalizedPersonEmail = personEmail.toLowerCase().trim();

    // Find all emails to/from this person
    const results = await db.execute(sql`
      SELECT 
        id,
        subject,
        snippet,
        received_at,
        from_address,
        to_addresses
      FROM emails
      WHERE account_id = ANY(${accountIds})
        AND received_at >= ${sinceDate}
        AND is_trashed = false
        AND (
          from_address->>'email' ILIKE ${normalizedPersonEmail}
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements(to_addresses) as addr
            WHERE addr->>'email' ILIKE ${normalizedPersonEmail}
          )
        )
      ORDER BY received_at DESC
      LIMIT 50
    `);

    const conversationEmails = (results as any[]).map((row: any) => {
      const fromEmail = row.from_address?.email?.toLowerCase();
      const isFromThem = fromEmail === normalizedPersonEmail;

      return {
        id: row.id,
        subject: row.subject,
        snippet: row.snippet || '',
        receivedAt: new Date(row.received_at),
        isFromThem,
      };
    });

    return { success: true, emails: conversationEmails };
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return { success: false, error: 'Failed to get conversation history' };
  }
}

/**
 * Get communication frequency with a person
 */
export async function getCommunicationFrequency(
  userId: string,
  personEmail: string
): Promise<{
  success: boolean;
  frequency?: {
    totalEmails: number;
    emailsReceived: number;
    emailsSent: number;
    lastContact: Date | null;
    averagePerMonth: number;
  };
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
      return {
        success: true,
        frequency: {
          totalEmails: 0,
          emailsReceived: 0,
          emailsSent: 0,
          lastContact: null,
          averagePerMonth: 0,
        },
      };
    }

    const accountIds = userAccounts.map((acc) => acc.id);
    const normalizedPersonEmail = personEmail.toLowerCase().trim();

    // Get all stats
    const results = await db.execute(sql`
      SELECT 
        COUNT(*) as total_count,
        SUM(CASE WHEN from_address->>'email' ILIKE ${normalizedPersonEmail} THEN 1 ELSE 0 END) as received_count,
        MAX(received_at) as last_contact_date
      FROM emails
      WHERE account_id = ANY(${accountIds})
        AND is_trashed = false
        AND (
          from_address->>'email' ILIKE ${normalizedPersonEmail}
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements(to_addresses) as addr
            WHERE addr->>'email' ILIKE ${normalizedPersonEmail}
          )
        )
    `);

    const row = (results as any[])[0];
    const totalCount = parseInt(row?.total_count || '0');
    const receivedCount = parseInt(row?.received_count || '0');
    const lastContactDate = row?.last_contact_date
      ? new Date(row.last_contact_date)
      : null;

    // Calculate average per month (assuming data for 12 months)
    const averagePerMonth = Math.round(totalCount / 12);

    return {
      success: true,
      frequency: {
        totalEmails: totalCount,
        emailsReceived: receivedCount,
        emailsSent: totalCount - receivedCount,
        lastContact: lastContactDate,
        averagePerMonth,
      },
    };
  } catch (error) {
    console.error('Error getting communication frequency:', error);
    return { success: false, error: 'Failed to get communication frequency' };
  }
}

/**
 * Get the last email from a specific person
 */
export async function getLastEmailFrom(
  userId: string,
  personEmail: string
): Promise<{
  success: boolean;
  email?: {
    id: string;
    subject: string;
    snippet: string;
    receivedAt: Date;
  };
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
      return { success: true, email: undefined };
    }

    const accountIds = userAccounts.map((acc) => acc.id);
    const normalizedPersonEmail = personEmail.toLowerCase().trim();

    const results = await db
      .select({
        id: emails.id,
        subject: emails.subject,
        snippet: emails.snippet,
        receivedAt: emails.receivedAt,
      })
      .from(emails)
      .where(
        and(
          sql`${emails.accountId} = ANY(${accountIds})`,
          sql`${emails.fromAddress}->>'email' ILIKE ${normalizedPersonEmail}`,
          eq(emails.isTrashed, false)
        )
      )
      .orderBy(desc(emails.receivedAt))
      .limit(1);

    if (results.length === 0) {
      return { success: true, email: undefined };
    }

    const lastEmail = results[0];
    return {
      success: true,
      email: {
        id: lastEmail.id,
        subject: lastEmail.subject,
        snippet: lastEmail.snippet || '',
        receivedAt: lastEmail.receivedAt,
      },
    };
  } catch (error) {
    console.error('Error getting last email from person:', error);
    return { success: false, error: 'Failed to get last email' };
  }
}

/**
 * Find related emails based on subject similarity or thread
 */
export async function findRelatedEmails(emailId: string): Promise<{
  success: boolean;
  emails?: Array<{
    id: string;
    subject: string;
    from: { name: string; email: string };
    receivedAt: Date;
    relationship: 'same_thread' | 'same_sender' | 'similar_subject';
  }>;
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

    // Get the original email
    const originalEmail = await db.query.emails.findFirst({
      where: eq(emails.id, emailId),
    });

    if (!originalEmail) {
      return { success: false, error: 'Email not found' };
    }

    // Verify ownership
    const account = await db.query.emailAccounts.findFirst({
      where: eq(emailAccounts.id, originalEmail.accountId),
    });

    if (!account || account.userId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const relatedEmails: Array<{
      id: string;
      subject: string;
      from: { name: string; email: string };
      receivedAt: Date;
      relationship: 'same_thread' | 'same_sender' | 'similar_subject';
    }> = [];

    // 1. Find emails in same thread
    if (originalEmail.threadId) {
      const threadEmails = await db
        .select({
          id: emails.id,
          subject: emails.subject,
          fromAddress: emails.fromAddress,
          receivedAt: emails.receivedAt,
        })
        .from(emails)
        .where(
          and(
            eq(emails.threadId, originalEmail.threadId),
            sql`${emails.id} != ${emailId}`,
            eq(emails.accountId, originalEmail.accountId)
          )
        )
        .orderBy(desc(emails.receivedAt))
        .limit(5);

      threadEmails.forEach((e) => {
        relatedEmails.push({
          id: e.id,
          subject: e.subject,
          from: e.fromAddress as { name: string; email: string },
          receivedAt: e.receivedAt,
          relationship: 'same_thread',
        });
      });
    }

    // 2. Find emails from same sender
    const senderEmail = (originalEmail.fromAddress as any).email;
    if (senderEmail) {
      const senderEmails = await db
        .select({
          id: emails.id,
          subject: emails.subject,
          fromAddress: emails.fromAddress,
          receivedAt: emails.receivedAt,
        })
        .from(emails)
        .where(
          and(
            sql`${emails.fromAddress}->>'email' = ${senderEmail}`,
            sql`${emails.id} != ${emailId}`,
            eq(emails.accountId, originalEmail.accountId)
          )
        )
        .orderBy(desc(emails.receivedAt))
        .limit(5);

      senderEmails.forEach((e) => {
        if (!relatedEmails.find((rel) => rel.id === e.id)) {
          relatedEmails.push({
            id: e.id,
            subject: e.subject,
            from: e.fromAddress as { name: string; email: string },
            receivedAt: e.receivedAt,
            relationship: 'same_sender',
          });
        }
      });
    }

    return { success: true, emails: relatedEmails.slice(0, 10) };
  } catch (error) {
    console.error('Error finding related emails:', error);
    return { success: false, error: 'Failed to find related emails' };
  }
}
