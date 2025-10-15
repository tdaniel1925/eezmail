/**
 * Contact Import/Export Functions
 * CSV and vCard support
 */

'use server';

import { db } from '@/lib/db';
import { contacts, contactEmails, contactPhones } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
}

export interface CSVContact {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
}

/**
 * Parse CSV content to contact objects
 */
function parseCSV(csvContent: string): CSVContact[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const contacts: CSVContact[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const contact: CSVContact = {};

    headers.forEach((header, index) => {
      const value = values[index];
      if (!value) return;

      switch (header) {
        case 'first name':
        case 'firstname':
          contact.firstName = value;
          break;
        case 'last name':
        case 'lastname':
          contact.lastName = value;
          break;
        case 'email':
        case 'email address':
          contact.email = value;
          break;
        case 'phone':
        case 'phone number':
          contact.phone = value;
          break;
        case 'company':
        case 'organization':
          contact.company = value;
          break;
        case 'job title':
        case 'title':
          contact.jobTitle = value;
          break;
        case 'notes':
        case 'note':
          contact.notes = value;
          break;
      }
    });

    if (contact.email || contact.firstName || contact.lastName) {
      contacts.push(contact);
    }
  }

  return contacts;
}

/**
 * Import contacts from CSV
 */
export async function importFromCSV(
  userId: string,
  csvContent: string
): Promise<ImportResult> {
  const errors: string[] = [];
  let imported = 0;
  let failed = 0;

  try {
    const csvContacts = parseCSV(csvContent);

    if (csvContacts.length === 0) {
      return {
        success: false,
        imported: 0,
        failed: 0,
        errors: ['No valid contacts found in CSV'],
      };
    }

    for (const csvContact of csvContacts) {
      try {
        // Create contact
        const [newContact] = await db
          .insert(contacts)
          .values({
            userId,
            firstName: csvContact.firstName || null,
            lastName: csvContact.lastName || null,
            displayName: csvContact.firstName
              ? `${csvContact.firstName} ${csvContact.lastName || ''}`.trim()
              : csvContact.lastName || null,
            company: csvContact.company || null,
            jobTitle: csvContact.jobTitle || null,
            notes: csvContact.notes || null,
            sourceType: 'manual',
          })
          .returning();

        // Add email if exists
        if (csvContact.email) {
          await db.insert(contactEmails).values({
            contactId: newContact.id,
            email: csvContact.email,
            type: 'other',
            isPrimary: true,
          });
        }

        // Add phone if exists
        if (csvContact.phone) {
          await db.insert(contactPhones).values({
            contactId: newContact.id,
            phone: csvContact.phone,
            type: 'other',
            isPrimary: true,
          });
        }

        imported++;
      } catch (error) {
        failed++;
        errors.push(
          `Failed to import ${csvContact.firstName} ${csvContact.lastName}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return {
      success: true,
      imported,
      failed,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      imported: 0,
      failed: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Export contacts to CSV
 */
export async function exportToCSV(
  userId: string,
  contactIds?: string[]
): Promise<string> {
  try {
    // Get contacts
    const contactList = contactIds
      ? await db
          .select()
          .from(contacts)
          .where(
            eq(contacts.userId, userId) && inArray(contacts.id, contactIds)
          )
      : await db.select().from(contacts).where(eq(contacts.userId, userId));

    // CSV Header
    let csv =
      'First Name,Last Name,Display Name,Company,Job Title,Email,Phone,Notes\n';

    // Get emails and phones for all contacts
    for (const contact of contactList) {
      const emails = await db
        .select()
        .from(contactEmails)
        .where(eq(contactEmails.contactId, contact.id));

      const phones = await db
        .select()
        .from(contactPhones)
        .where(eq(contactPhones.contactId, contact.id));

      const primaryEmail =
        emails.find((e) => e.isPrimary)?.email || emails[0]?.email || '';
      const primaryPhone =
        phones.find((p) => p.isPrimary)?.phone || phones[0]?.phone || '';

      csv += `"${contact.firstName || ''}","${contact.lastName || ''}","${contact.displayName || ''}","${contact.company || ''}","${contact.jobTitle || ''}","${primaryEmail}","${primaryPhone}","${contact.notes || ''}"\n`;
    }

    return csv;
  } catch (error) {
    console.error('Error exporting contacts to CSV:', error);
    throw new Error('Failed to export contacts');
  }
}

/**
 * Parse vCard content (simplified version)
 */
function parseVCard(vCardContent: string): CSVContact[] {
  const contacts: CSVContact[] = [];
  const vcards = vCardContent.split('BEGIN:VCARD');

  for (const vcard of vcards) {
    if (!vcard.trim()) continue;

    const contact: CSVContact = {};
    const lines = vcard.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('FN:')) {
        const fullName = trimmed.substring(3);
        const parts = fullName.split(' ');
        contact.firstName = parts[0];
        contact.lastName = parts.slice(1).join(' ');
      } else if (trimmed.startsWith('EMAIL')) {
        contact.email = trimmed.split(':')[1];
      } else if (trimmed.startsWith('TEL')) {
        contact.phone = trimmed.split(':')[1];
      } else if (trimmed.startsWith('ORG:')) {
        contact.company = trimmed.substring(4);
      } else if (trimmed.startsWith('TITLE:')) {
        contact.jobTitle = trimmed.substring(6);
      } else if (trimmed.startsWith('NOTE:')) {
        contact.notes = trimmed.substring(5);
      }
    }

    if (contact.email || contact.firstName) {
      contacts.push(contact);
    }
  }

  return contacts;
}

/**
 * Import contacts from vCard
 */
export async function importFromVCard(
  userId: string,
  vCardContent: string
): Promise<ImportResult> {
  // Use same logic as CSV import but parse vCard format
  const vCardContacts = parseVCard(vCardContent);

  // Convert to CSV format and use CSV import logic
  let csvContent = 'First Name,Last Name,Email,Phone,Company,Job Title,Notes\n';
  vCardContacts.forEach((contact) => {
    csvContent += `"${contact.firstName || ''}","${contact.lastName || ''}","${contact.email || ''}","${contact.phone || ''}","${contact.company || ''}","${contact.jobTitle || ''}","${contact.notes || ''}"\n`;
  });

  return importFromCSV(userId, csvContent);
}

/**
 * Export contacts to vCard
 */
export async function exportToVCard(
  userId: string,
  contactIds?: string[]
): Promise<string> {
  try {
    const contactList = contactIds
      ? await db
          .select()
          .from(contacts)
          .where(
            eq(contacts.userId, userId) && inArray(contacts.id, contactIds)
          )
      : await db.select().from(contacts).where(eq(contacts.userId, userId));

    let vcard = '';

    for (const contact of contactList) {
      const emails = await db
        .select()
        .from(contactEmails)
        .where(eq(contactEmails.contactId, contact.id));

      const phones = await db
        .select()
        .from(contactPhones)
        .where(eq(contactPhones.contactId, contact.id));

      vcard += 'BEGIN:VCARD\n';
      vcard += 'VERSION:3.0\n';
      vcard += `FN:${contact.displayName || `${contact.firstName} ${contact.lastName}`.trim()}\n`;
      if (contact.firstName)
        vcard += `N:${contact.lastName};${contact.firstName};;;\n`;
      if (contact.company) vcard += `ORG:${contact.company}\n`;
      if (contact.jobTitle) vcard += `TITLE:${contact.jobTitle}\n`;

      emails.forEach((email) => {
        vcard += `EMAIL;TYPE=${email.type}:${email.email}\n`;
      });

      phones.forEach((phone) => {
        vcard += `TEL;TYPE=${phone.type}:${phone.phone}\n`;
      });

      if (contact.notes) vcard += `NOTE:${contact.notes}\n`;
      vcard += 'END:VCARD\n\n';
    }

    return vcard;
  } catch (error) {
    console.error('Error exporting contacts to vCard:', error);
    throw new Error('Failed to export contacts');
  }
}
