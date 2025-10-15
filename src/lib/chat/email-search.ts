'use server';

import { db } from '@/lib/db';
import { emails, emailAccounts } from '@/db/schema';
import { eq, and, or, like, desc, sql } from 'drizzle-orm';

export interface EmailSearchResult {
  id: string;
  subject: string;
  fromAddress: {
    name: string;
    email: string;
  };
  snippet: string;
  receivedAt: Date;
  isRead: boolean;
  emailCategory: string;
}

/**
 * Search emails using full-text search
 */
export async function searchEmails(
  query: string,
  userId: string,
  method: 'fulltext' | 'semantic' = 'fulltext'
): Promise<EmailSearchResult[]> {
  try {
    // Get user's email accounts
    const userAccounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, userId),
    });

    if (userAccounts.length === 0) {
      return [];
    }

    const accountIds = userAccounts.map((acc) => acc.id);

    if (method === 'fulltext') {
      // Simple text search across subject and body
      const results = await db
        .select({
          id: emails.id,
          subject: emails.subject,
          fromAddress: emails.fromAddress,
          snippet: emails.snippet,
          receivedAt: emails.receivedAt,
          isRead: emails.isRead,
          emailCategory: emails.emailCategory,
        })
        .from(emails)
        .where(
          and(
            sql`${emails.accountId} = ANY(${accountIds})`,
            or(
              like(emails.subject, `%${query}%`),
              like(emails.bodyText, `%${query}%`),
              sql`${emails.fromAddress}::text LIKE ${`%${query}%`}`
            )
          )
        )
        .orderBy(desc(emails.receivedAt))
        .limit(20);

      return results.map((r) => ({
        id: r.id,
        subject: r.subject,
        fromAddress: r.fromAddress as { name: string; email: string },
        snippet: r.snippet || '',
        receivedAt: r.receivedAt,
        isRead: r.isRead,
        emailCategory: r.emailCategory || 'unscreened',
      }));
    }

    // For semantic search, fall back to fulltext for now
    // TODO: Implement embeddings-based semantic search
    return searchEmails(query, userId, 'fulltext');
  } catch (error) {
    console.error('Error searching emails:', error);
    return [];
  }
}

/**
 * Search emails by sender
 */
export async function searchEmailsBySender(
  senderQuery: string,
  userId: string
): Promise<EmailSearchResult[]> {
  try {
    const userAccounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, userId),
    });

    if (userAccounts.length === 0) {
      return [];
    }

    const accountIds = userAccounts.map((acc) => acc.id);

    const results = await db
      .select({
        id: emails.id,
        subject: emails.subject,
        fromAddress: emails.fromAddress,
        snippet: emails.snippet,
        receivedAt: emails.receivedAt,
        isRead: emails.isRead,
        emailCategory: emails.emailCategory,
      })
      .from(emails)
      .where(
        and(
          sql`${emails.accountId} = ANY(${accountIds})`,
          sql`${emails.fromAddress}::text ILIKE ${`%${senderQuery}%`}`
        )
      )
      .orderBy(desc(emails.receivedAt))
      .limit(20);

    return results.map((r) => ({
      id: r.id,
      subject: r.subject,
      fromAddress: r.fromAddress as { name: string; email: string },
      snippet: r.snippet || '',
      receivedAt: r.receivedAt,
      isRead: r.isRead,
      emailCategory: r.emailCategory || 'unscreened',
    }));
  } catch (error) {
    console.error('Error searching emails by sender:', error);
    return [];
  }
}

/**
 * Search emails by date range
 */
export async function searchEmailsByDateRange(
  startDate: Date,
  endDate: Date,
  userId: string
): Promise<EmailSearchResult[]> {
  try {
    const userAccounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, userId),
    });

    if (userAccounts.length === 0) {
      return [];
    }

    const accountIds = userAccounts.map((acc) => acc.id);

    const results = await db
      .select({
        id: emails.id,
        subject: emails.subject,
        fromAddress: emails.fromAddress,
        snippet: emails.snippet,
        receivedAt: emails.receivedAt,
        isRead: emails.isRead,
        emailCategory: emails.emailCategory,
      })
      .from(emails)
      .where(
        and(
          sql`${emails.accountId} = ANY(${accountIds})`,
          sql`${emails.receivedAt} >= ${startDate}`,
          sql`${emails.receivedAt} <= ${endDate}`
        )
      )
      .orderBy(desc(emails.receivedAt))
      .limit(50);

    return results.map((r) => ({
      id: r.id,
      subject: r.subject,
      fromAddress: r.fromAddress as { name: string; email: string },
      snippet: r.snippet || '',
      receivedAt: r.receivedAt,
      isRead: r.isRead,
      emailCategory: r.emailCategory || 'unscreened',
    }));
  } catch (error) {
    console.error('Error searching emails by date range:', error);
    return [];
  }
}

/**
 * Get recent unread emails
 */
export async function getUnreadEmails(
  userId: string,
  limit: number = 10
): Promise<EmailSearchResult[]> {
  try {
    const userAccounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, userId),
    });

    if (userAccounts.length === 0) {
      return [];
    }

    const accountIds = userAccounts.map((acc) => acc.id);

    const results = await db
      .select({
        id: emails.id,
        subject: emails.subject,
        fromAddress: emails.fromAddress,
        snippet: emails.snippet,
        receivedAt: emails.receivedAt,
        isRead: emails.isRead,
        emailCategory: emails.emailCategory,
      })
      .from(emails)
      .where(
        and(
          sql`${emails.accountId} = ANY(${accountIds})`,
          eq(emails.isRead, false)
        )
      )
      .orderBy(desc(emails.receivedAt))
      .limit(limit);

    return results.map((r) => ({
      id: r.id,
      subject: r.subject,
      fromAddress: r.fromAddress as { name: string; email: string },
      snippet: r.snippet || '',
      receivedAt: r.receivedAt,
      isRead: r.isRead,
      emailCategory: r.emailCategory || 'unscreened',
    }));
  } catch (error) {
    console.error('Error getting unread emails:', error);
    return [];
  }
}
