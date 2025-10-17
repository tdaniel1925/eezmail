'use server';

import { db } from '@/lib/db';
import { contacts, contactEmails, contactPhones } from '@/db/schema';
import { eq, or, ilike, and, sql } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { isValidEmail, parseEmailAddress } from './email-utils';

/**
 * Create a new contact
 */
export async function createContact(params: {
  userId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
}): Promise<{ success: boolean; contactId?: string; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, message: 'Unauthorized' };
    }

    // Create contact
    const [newContact] = await db
      .insert(contacts)
      .values({
        userId: params.userId,
        firstName: params.firstName || '',
        lastName: params.lastName || '',
        displayName:
          params.firstName && params.lastName
            ? `${params.firstName} ${params.lastName}`
            : params.firstName || params.lastName || params.email,
        company: params.company,
        jobTitle: params.jobTitle,
        notes: params.notes,
      } as any)
      .returning();

    // Add email
    await db.insert(contactEmails).values({
      contactId: newContact.id,
      email: params.email,
      type: 'work',
      isPrimary: true,
    } as any);

    return {
      success: true,
      contactId: newContact.id,
      message: `Created contact for ${newContact.displayName}`,
    };
  } catch (error) {
    console.error('Error creating contact:', error);
    return { success: false, message: 'Failed to create contact' };
  }
}

/**
 * Update an existing contact
 */
export async function updateContact(params: {
  userId: string;
  contactId: string;
  updates: Record<string, any>;
}): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, message: 'Unauthorized' };
    }

    // Verify contact ownership
    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.id, params.contactId),
    });

    if (!contact || contact.userId !== params.userId) {
      return { success: false, message: 'Contact not found' };
    }

    // Update contact
    await db
      .update(contacts)
      .set({ ...params.updates, updatedAt: new Date() } as any)
      .where(eq(contacts.id, params.contactId));

    return {
      success: true,
      message: `Updated contact ${contact.displayName}`,
    };
  } catch (error) {
    console.error('Error updating contact:', error);
    return { success: false, message: 'Failed to update contact' };
  }
}

/**
 * Delete a contact
 */
export async function deleteContact(params: {
  userId: string;
  contactId: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, message: 'Unauthorized' };
    }

    // Verify contact ownership
    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.id, params.contactId),
    });

    if (!contact || contact.userId !== params.userId) {
      return { success: false, message: 'Contact not found' };
    }

    // Delete contact (cascade will handle emails)
    await db.delete(contacts).where(eq(contacts.id, params.contactId));

    return {
      success: true,
      message: `Deleted contact ${contact.displayName}`,
    };
  } catch (error) {
    console.error('Error deleting contact:', error);
    return { success: false, message: 'Failed to delete contact' };
  }
}

/**
 * Search contacts
 */
export async function searchContacts(params: {
  userId: string;
  query: string;
}): Promise<{ success: boolean; contacts: any[]; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, contacts: [], message: 'Unauthorized' };
    }

    // Search by name, company, or email
    const results = await db.query.contacts.findMany({
      where: or(
        ilike(contacts.displayName, `%${params.query}%`),
        ilike(contacts.firstName, `%${params.query}%`),
        ilike(contacts.lastName, `%${params.query}%`),
        ilike(contacts.company, `%${params.query}%`)
      ),
      with: {
        emails: true,
      },
      limit: 20,
    });

    return {
      success: true,
      contacts: results,
      message: `Found ${results.length} contacts`,
    };
  } catch (error) {
    console.error('Error searching contacts:', error);
    return { success: false, contacts: [], message: 'Search failed' };
  }
}

/**
 * Get contact details
 */
export async function getContactDetails(params: {
  userId: string;
  contactId: string;
}): Promise<{ success: boolean; contact?: any; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, message: 'Unauthorized' };
    }

    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.id, params.contactId),
      with: {
        emails: true,
        phones: true,
        addresses: true,
        socialLinks: true,
      },
    });

    if (!contact || contact.userId !== params.userId) {
      return { success: false, message: 'Contact not found' };
    }

    return {
      success: true,
      contact,
      message: `Retrieved contact ${contact.displayName}`,
    };
  } catch (error) {
    console.error('Error getting contact details:', error);
    return { success: false, message: 'Failed to get contact details' };
  }
}

// ============================================================================
// EMAIL VERIFICATION & ENHANCED CONTACT FUNCTIONS
// ============================================================================

/**
 * Search contact by email address
 */
export async function findContactByEmail(params: {
  userId: string;
  email: string;
}): Promise<{
  success: boolean;
  found: boolean;
  contact?: any;
  message: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, found: false, message: 'Unauthorized' };
    }

    // Normalize email for comparison
    const normalizedEmail = params.email.toLowerCase().trim();

    // Search for contact email first
    const emailRecord = await db
      .select()
      .from(contactEmails)
      .where(sql`LOWER(${contactEmails.email}) = ${normalizedEmail}`)
      .limit(1);

    if (emailRecord.length === 0) {
      return {
        success: true,
        found: false,
        message: `No contact found for ${params.email}`,
      };
    }

    // Get the contact details
    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.id, emailRecord[0].contactId),
      with: {
        emails: true,
      },
    });

    if (!contact || contact.userId !== params.userId) {
      return {
        success: true,
        found: false,
        message: `No contact found for ${params.email}`,
      };
    }

    return {
      success: true,
      found: true,
      contact,
      message: `Found contact: ${contact.displayName}`,
    };
  } catch (error) {
    console.error('Error searching contact by email:', error);
    return {
      success: false,
      found: false,
      message: 'Failed to search contacts',
    };
  }
}

/**
 * Create contact from parsed email info
 */
export async function createContactFromEmail(params: {
  userId: string;
  email: string;
  name?: string;
}): Promise<{ success: boolean; contactId?: string; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, message: 'Unauthorized' };
    }

    // Check if contact already exists
    const existing = await findContactByEmail({
      userId: params.userId,
      email: params.email,
    });

    if (existing.found) {
      return {
        success: false,
        message: `Contact already exists: ${existing.contact?.displayName}`,
      };
    }

    // Parse name if provided
    let firstName = '';
    let lastName = '';
    if (params.name) {
      const nameParts = params.name.trim().split(/\s+/);
      if (nameParts.length === 1) {
        firstName = nameParts[0];
      } else if (nameParts.length >= 2) {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      }
    }

    // Create contact
    const [newContact] = await db
      .insert(contacts)
      .values({
        userId: params.userId,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        displayName: params.name || params.email,
      } as any)
      .returning();

    // Add email
    await db.insert(contactEmails).values({
      contactId: newContact.id,
      email: params.email.toLowerCase().trim(),
      type: 'work',
      isPrimary: true,
    } as any);

    return {
      success: true,
      contactId: newContact.id,
      message: `Created contact for ${newContact.displayName} (${params.email})`,
    };
  } catch (error) {
    console.error('Error creating contact from email:', error);
    return { success: false, message: 'Failed to create contact' };
  }
}

/**
 * List all contacts with pagination
 */
export async function listAllContacts(params: {
  userId: string;
  limit?: number;
  offset?: number;
}): Promise<{
  success: boolean;
  contacts: any[];
  total: number;
  message: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return {
        success: false,
        contacts: [],
        total: 0,
        message: 'Unauthorized',
      };
    }

    const limit = params.limit || 50;
    const offset = params.offset || 0;

    // Get contacts with pagination
    const results = await db.query.contacts.findMany({
      where: eq(contacts.userId, params.userId),
      with: {
        emails: true,
        phones: true,
      },
      limit,
      offset,
      orderBy: (contacts, { desc }) => [desc(contacts.lastContactedAt)],
    });

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(contacts)
      .where(eq(contacts.userId, params.userId));

    const total = Number(totalResult[0]?.count || 0);

    return {
      success: true,
      contacts: results,
      total,
      message: `Retrieved ${results.length} of ${total} contacts`,
    };
  } catch (error) {
    console.error('Error listing contacts:', error);
    return {
      success: false,
      contacts: [],
      total: 0,
      message: 'Failed to list contacts',
    };
  }
}
