/**
 * Nylas Contact Sync
 * Sync contacts from Gmail/Microsoft via Nylas API
 */

'use server';

import Nylas from 'nylas';
import { db } from '@/lib/db';
import { contacts, contactEmails, contactPhones } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const nylas = new Nylas({
  apiKey: process.env.NYLAS_API_KEY || '',
});

export interface NylasContact {
  id: string;
  givenName?: string;
  surname?: string;
  nickname?: string;
  companyName?: string;
  jobTitle?: string;
  emails?: Array<{ email: string; type?: string }>;
  phoneNumbers?: Array<{ number: string; type?: string }>;
  birthday?: string;
  notes?: string;
  picture?: string;
}

export interface SyncResult {
  success: boolean;
  contactsSynced: number;
  contactsCreated: number;
  contactsUpdated: number;
  error?: string;
}

/**
 * Sync contacts from a Nylas-connected email account
 */
export async function syncContactsFromNylas(
  userId: string,
  grantId: string
): Promise<SyncResult> {
  try {
    // Fetch contacts from Nylas
    const nylasContacts = await nylas.contacts.list({
      identifier: grantId,
      queryParams: {
        limit: 1000, // Adjust as needed
      },
    });

    let created = 0;
    let updated = 0;

    for (const nylasContact of nylasContacts.data) {
      try {
        // Check if contact already exists by email
        const primaryEmail = nylasContact.emails?.[0]?.email;
        if (!primaryEmail) continue; // Skip contacts without email

        // Check if we have a contact with this email
        const existingContactEmail = await db
          .select({ contactId: contactEmails.contactId })
          .from(contactEmails)
          .where(eq(contactEmails.email, primaryEmail))
          .limit(1);

        if (existingContactEmail.length > 0) {
          // Update existing contact
          const contactId = existingContactEmail[0].contactId;
          await db
            .update(contacts)
            .set({
              firstName: nylasContact.givenName || null,
              lastName: nylasContact.surname || null,
              nickname: nylasContact.nickname || null,
              company: nylasContact.companyName || null,
              jobTitle: nylasContact.jobTitle || null,
              notes: nylasContact.notes || null,
              avatarUrl: nylasContact.pictureUrl || null,
              avatarProvider: 'synced',
              sourceType: 'synced',
              sourceProvider: 'gmail', // or detect from grantId
              sourceId: nylasContact.id,
              updatedAt: new Date(),
            })
            .where(
              and(eq(contacts.id, contactId), eq(contacts.userId, userId))
            );

          updated++;
        } else {
          // Create new contact
          const [newContact] = await db
            .insert(contacts)
            .values({
              userId,
              firstName: nylasContact.givenName || null,
              lastName: nylasContact.surname || null,
              displayName: nylasContact.givenName
                ? `${nylasContact.givenName} ${nylasContact.surname || ''}`.trim()
                : null,
              nickname: nylasContact.nickname || null,
              company: nylasContact.companyName || null,
              jobTitle: nylasContact.jobTitle || null,
              notes: nylasContact.notes || null,
              avatarUrl: nylasContact.pictureUrl || null,
              avatarProvider: 'synced',
              sourceType: 'synced',
              sourceProvider: 'gmail',
              sourceId: nylasContact.id,
            })
            .returning();

          // Add email addresses
          if (nylasContact.emails && nylasContact.emails.length > 0) {
            const validEmails = nylasContact.emails.filter((e) => e.email);
            if (validEmails.length > 0) {
              await db.insert(contactEmails).values(
                validEmails.map((email, index) => ({
                  contactId: newContact.id,
                  email: email.email!,
                  type:
                    email.type === 'work'
                      ? ('work' as const)
                      : email.type === 'personal'
                        ? ('personal' as const)
                        : ('other' as const),
                  isPrimary: index === 0,
                }))
              );
            }
          }

          // Add phone numbers
          if (
            nylasContact.phoneNumbers &&
            nylasContact.phoneNumbers.length > 0
          ) {
            const validPhones = nylasContact.phoneNumbers.filter(
              (p) => p.number
            );
            if (validPhones.length > 0) {
              await db.insert(contactPhones).values(
                validPhones.map((phone, index) => ({
                  contactId: newContact.id,
                  phone: phone.number!,
                  type:
                    phone.type === 'mobile'
                      ? ('mobile' as const)
                      : phone.type === 'work'
                        ? ('work' as const)
                        : phone.type === 'home'
                          ? ('home' as const)
                          : ('other' as const),
                  isPrimary: index === 0,
                }))
              );
            }
          }

          created++;
        }
      } catch (error) {
        console.error('Error syncing individual contact:', error);
        // Continue with next contact
      }
    }

    return {
      success: true,
      contactsSynced: nylasContacts.data.length,
      contactsCreated: created,
      contactsUpdated: updated,
    };
  } catch (error) {
    console.error('Error syncing contacts from Nylas:', error);
    return {
      success: false,
      contactsSynced: 0,
      contactsCreated: 0,
      contactsUpdated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch avatar URL from provider
 */
export async function fetchContactAvatar(
  grantId: string,
  contactId: string
): Promise<string | null> {
  try {
    const contact = await nylas.contacts.find({
      identifier: grantId,
      contactId,
      queryParams: {},
    });

    return contact.data.pictureUrl || null;
  } catch (error) {
    console.error('Error fetching contact avatar:', error);
    return null;
  }
}
