/**
 * Contact Email History Functions
 * Query emails exchanged with contacts
 */

'use server';

import { db } from '@/lib/db';
import { emails, contactEmails } from '@/db/schema';
import { eq, or, sql, desc } from 'drizzle-orm';
import type { Email } from '@/db/schema';

export interface EmailHistoryOptions {
  limit?: number;
  offset?: number;
  includeArchived?: boolean;
}

export interface EmailHistoryResult {
  emails: Email[];
  total: number;
  sentCount: number;
  receivedCount: number;
}

/**
 * Get all emails exchanged with a contact
 */
export async function getEmailHistoryForContact(
  contactId: string,
  _userId: string,
  options: EmailHistoryOptions = {}
): Promise<EmailHistoryResult> {
  try {
    const { limit = 50, offset = 0 } = options;

    // Get all email addresses for this contact
    const contactEmailAddresses = await db
      .select({ email: contactEmails.email })
      .from(contactEmails)
      .where(eq(contactEmails.contactId, contactId));

    if (contactEmailAddresses.length === 0) {
      return { emails: [], total: 0, sentCount: 0, receivedCount: 0 };
    }

    const emailAddressList = contactEmailAddresses.map((ce) => ce.email);

    // Query emails where any of the contact's emails appear in from/to/cc/bcc
    // This is a complex query that checks JSON fields
    const emailList = await db
      .select()
      .from(emails)
      .where(
        or(
          // From address matches
          sql`${emails.fromAddress}->>'email' = ANY(${emailAddressList})`,
          // To addresses contain the email
          sql`EXISTS (
            SELECT 1 FROM jsonb_array_elements(${emails.toAddresses}) AS to_addr
            WHERE to_addr->>'email' = ANY(${emailAddressList})
          )`,
          // CC addresses contain the email
          sql`EXISTS (
            SELECT 1 FROM jsonb_array_elements(${emails.ccAddresses}) AS cc_addr
            WHERE cc_addr->>'email' = ANY(${emailAddressList})
          )`,
          // BCC addresses contain the email
          sql`EXISTS (
            SELECT 1 FROM jsonb_array_elements(${emails.bccAddresses}) AS bcc_addr
            WHERE bcc_addr->>'email' = ANY(${emailAddressList})
          )`
        )
      )
      .orderBy(desc(emails.receivedAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(
        or(
          sql`${emails.fromAddress}->>'email' = ANY(${emailAddressList})`,
          sql`EXISTS (
            SELECT 1 FROM jsonb_array_elements(${emails.toAddresses}) AS to_addr
            WHERE to_addr->>'email' = ANY(${emailAddressList})
          )`,
          sql`EXISTS (
            SELECT 1 FROM jsonb_array_elements(${emails.ccAddresses}) AS cc_addr
            WHERE cc_addr->>'email' = ANY(${emailAddressList})
          )`,
          sql`EXISTS (
            SELECT 1 FROM jsonb_array_elements(${emails.bccAddresses}) AS bcc_addr
            WHERE bcc_addr->>'email' = ANY(${emailAddressList})
          )`
        )
      );

    const total = totalResult[0]?.count || 0;

    // Count sent vs received
    const sentCount = emailList.filter((email) =>
      emailAddressList.includes(email.fromAddress.email)
    ).length;
    const receivedCount = emailList.length - sentCount;

    return {
      emails: emailList,
      total,
      sentCount,
      receivedCount,
    };
  } catch (error) {
    console.error('Error fetching email history:', error);
    return { emails: [], total: 0, sentCount: 0, receivedCount: 0 };
  }
}

/**
 * Get recent email interactions for a contact
 */
export async function getRecentInteractions(
  contactId: string,
  userId: string,
  limit: number = 10
): Promise<Email[]> {
  const result = await getEmailHistoryForContact(contactId, userId, { limit });
  return result.emails;
}
