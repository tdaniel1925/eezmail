'use server';

import { db } from '@/lib/db';
import {
  contacts,
  contactEmails,
  contactPhones,
  contactTags,
} from '@/db/schema';
import { eq } from 'drizzle-orm';

interface ContactRow {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  tags?: string;
  notes?: string;
}

interface BulkUploadResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

/**
 * Parse CSV file to array of objects using custom column mappings
 */
async function parseCSV(
  file: File,
  columnMappings?: Record<string, string>
): Promise<ContactRow[]> {
  const text = await file.text();
  const lines = text.split('\n').filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no data rows');
  }

  // Parse header
  const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));

  // Use custom mappings if provided, otherwise use auto-mapping
  let finalMappings: Record<string, string>;

  if (columnMappings) {
    // User provided custom mappings
    finalMappings = columnMappings;
  } else {
    // Auto-map using the original logic
    const headerMap: Record<string, string> = {
      'first name': 'firstName',
      firstname: 'firstName',
      'last name': 'lastName',
      lastname: 'lastName',
      email: 'email',
      'email address': 'email',
      phone: 'phone',
      'phone number': 'phone',
      company: 'company',
      organization: 'company',
      'job title': 'jobTitle',
      jobtitle: 'jobTitle',
      title: 'jobTitle',
      address: 'address',
      city: 'city',
      state: 'state',
      province: 'state',
      'zip code': 'zipCode',
      zip: 'zipCode',
      zipcode: 'zipCode',
      postal: 'zipCode',
      country: 'country',
      tags: 'tags',
      notes: 'notes',
      note: 'notes',
    };

    finalMappings = {};
    headers.forEach((header) => {
      const lower = header.toLowerCase();
      const targetField = headerMap[lower];
      if (targetField) {
        finalMappings[header] = targetField;
      }
    });
  }

  // Parse data rows
  const rows: ContactRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parser (handles basic cases)
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    const row: ContactRow = {};
    headers.forEach((header, index) => {
      const targetField = finalMappings[header];
      if (targetField) {
        const value = values[index]?.replace(/^"|"$/g, '').trim();
        if (value) {
          (row as any)[targetField] = value;
        }
      }
    });

    rows.push(row);
  }

  return rows;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate contact row
 */
function validateContactRow(row: ContactRow, rowNumber: number): string | null {
  // At least one of firstName, lastName, or email must be present
  if (!row.firstName && !row.lastName && !row.email) {
    return 'At least one of First Name, Last Name, or Email is required';
  }

  // Validate email if provided
  if (row.email && !isValidEmail(row.email)) {
    return `Invalid email format: ${row.email}`;
  }

  return null;
}

/**
 * Bulk create contacts from CSV/Excel file
 */
export async function bulkCreateContacts(
  userId: string,
  file: File,
  columnMappings?: Record<string, string>
): Promise<BulkUploadResult> {
  const result: BulkUploadResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Parse the file with custom mappings
    const rows = await parseCSV(file, columnMappings);

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because: 1 for header, 1 for 0-index

      try {
        // Validate row
        const validationError = validateContactRow(row, rowNumber);
        if (validationError) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            error: validationError,
          });
          continue;
        }

        // Generate display name
        let displayName = '';
        if (row.firstName && row.lastName) {
          displayName = `${row.firstName} ${row.lastName}`;
        } else if (row.firstName) {
          displayName = row.firstName;
        } else if (row.lastName) {
          displayName = row.lastName;
        } else if (row.email) {
          displayName = row.email.split('@')[0];
        }

        // Insert contact
        const [contact] = await db
          .insert(contacts)
          .values({
            userId,
            firstName: row.firstName || null,
            lastName: row.lastName || null,
            displayName,
            company: row.company || null,
            jobTitle: row.jobTitle || null,
            notes: row.notes || null,
            source: 'import',
          })
          .returning({ id: contacts.id });

        // Insert email if provided
        if (row.email) {
          await db.insert(contactEmails).values({
            contactId: contact.id,
            email: row.email,
            type: 'work',
            isPrimary: true,
          });
        }

        // Insert phone if provided
        if (row.phone) {
          await db.insert(contactPhones).values({
            contactId: contact.id,
            phone: row.phone,
            type: 'work',
            isPrimary: true,
          });
        }

        // Insert tags if provided
        if (row.tags) {
          const tagNames = row.tags
            .split('|')
            .map((t) => t.trim())
            .filter(Boolean);
          for (const tagName of tagNames) {
            await db.insert(contactTags).values({
              contactId: contact.id,
              name: tagName,
              color: 'blue', // Default color
            });
          }
        }

        result.success++;
      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        result.failed++;
        result.errors.push({
          row: rowNumber,
          error:
            error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Error in bulkCreateContacts:', error);
    throw error;
  }
}
