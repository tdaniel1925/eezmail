'use server';

import { db } from '@/lib/db';
import { contacts, contactEmails } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

/**
 * Find a contact by email address
 * Returns contact ID if found, null otherwise
 *
 * @param email - Email address to search for
 * @returns Contact ID or null
 */
export async function findContactByEmail(
  email: string
): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Find contact with matching email
    const result = await db
      .select({ contactId: contactEmails.contactId })
      .from(contactEmails)
      .innerJoin(contacts, eq(contacts.id, contactEmails.contactId))
      .where(
        and(
          eq(contacts.userId, user.id),
          eq(contactEmails.email, normalizedEmail)
        )
      )
      .limit(1);

    return result[0]?.contactId || null;
  } catch (error) {
    console.error('Error finding contact by email:', error);
    return null;
  }
}

/**
 * Find contacts for multiple email addresses
 * Returns map of email -> contactId
 *
 * @param emails - Array of email addresses to search for
 * @returns Record mapping email addresses to contact IDs
 */
export async function findContactsByEmails(
  emails: string[]
): Promise<Record<string, string>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || emails.length === 0) return {};

  try {
    const normalizedEmails = emails.map((e) => e.toLowerCase().trim());

    const results = await db
      .select({
        email: contactEmails.email,
        contactId: contactEmails.contactId,
      })
      .from(contactEmails)
      .innerJoin(contacts, eq(contacts.id, contactEmails.contactId))
      .where(
        and(
          eq(contacts.userId, user.id),
          inArray(contactEmails.email, normalizedEmails)
        )
      );

    return Object.fromEntries(results.map((r) => [r.email, r.contactId]));
  } catch (error) {
    console.error('Error finding contacts by emails:', error);
    return {};
  }
}
