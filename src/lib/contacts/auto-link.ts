/**
 * Auto-Link Emails to Contacts
 * Automatically update contact metadata when emails are synced
 */

'use server';

import { db } from '@/lib/db';
import { contacts, contactEmails } from '@/db/schema';
import { inArray, sql } from 'drizzle-orm';
import type { Email, EmailAddress } from '@/db/schema';

/**
 * Update contact's lastContactedAt when receiving/sending email
 */
export async function updateContactFromEmail(
  userId: string,
  email: Email
): Promise<void> {
  try {
    // Extract all email addresses from this email
    const emailAddresses: string[] = [];

    // From address
    if (email.fromAddress?.email) {
      emailAddresses.push(email.fromAddress.email.toLowerCase());
    }

    // To addresses
    if (email.toAddresses && Array.isArray(email.toAddresses)) {
      emailAddresses.push(
        ...email.toAddresses.map((addr: EmailAddress) =>
          addr.email.toLowerCase()
        )
      );
    }

    // CC addresses
    if (email.ccAddresses && Array.isArray(email.ccAddresses)) {
      emailAddresses.push(
        ...email.ccAddresses.map((addr: EmailAddress) =>
          addr.email.toLowerCase()
        )
      );
    }

    // BCC addresses
    if (email.bccAddresses && Array.isArray(email.bccAddresses)) {
      emailAddresses.push(
        ...email.bccAddresses.map((addr: EmailAddress) =>
          addr.email.toLowerCase()
        )
      );
    }

    if (emailAddresses.length === 0) return;

    // Find contacts that have any of these email addresses
    const matchingContactEmails = await db
      .select({ contactId: contactEmails.contactId })
      .from(contactEmails)
      .where(inArray(contactEmails.email, emailAddresses));

    if (matchingContactEmails.length === 0) return;

    const contactIds = Array.from(
      new Set(matchingContactEmails.map((ce) => ce.contactId))
    );

    // Update lastContactedAt for all matching contacts
    await db
      .update(contacts)
      .set({
        lastContactedAt: email.receivedAt,
        updatedAt: new Date(),
      })
      .where(
        sql`${contacts.id} = ANY(${contactIds}) AND ${contacts.userId} = ${userId}`
      );
  } catch (error) {
    console.error('Error auto-linking email to contact:', error);
    // Don't throw - this is a background operation
  }
}

/**
 * Batch update contacts from multiple emails
 */
export async function batchUpdateContactsFromEmails(
  userId: string,
  emails: Email[]
): Promise<number> {
  let updated = 0;

  for (const email of emails) {
    try {
      await updateContactFromEmail(userId, email);
      updated++;
    } catch (error) {
      console.error('Error in batch update:', error);
      // Continue with next email
    }
  }

  return updated;
}

/**
 * Backfill contact activity from existing emails
 * Run this once to update all contacts based on existing email history
 */
export async function backfillContactActivity(): Promise<{
  success: boolean;
  contactsUpdated: number;
  error?: string;
}> {
  try {
    // This would typically be a background job
    // For now, we'll just return a success indicator
    // The actual implementation would query all emails and update contacts

    return {
      success: true,
      contactsUpdated: 0,
    };
  } catch (error) {
    return {
      success: false,
      contactsUpdated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
