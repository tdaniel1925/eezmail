/**
 * Contact Search Functions
 * Fuzzy search across all contact fields
 */

'use server';

import { db } from '@/lib/db';
import {
  contacts,
  contactEmails,
  contactPhones,
  contactTags,
  contactTagAssignments,
} from '@/db/schema';
import { eq, or, ilike, sql, and, desc, asc } from 'drizzle-orm';
import type { Contact } from '@/db/schema';

export interface SearchFilters {
  query?: string;
  favorites?: boolean;
  tags?: string[];
  hasEmail?: boolean;
  hasPhone?: boolean;
  company?: string;
  recentlyAdded?: number; // days
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'company' | 'recent' | 'contacted';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  contacts: Contact[];
  total: number;
}

/**
 * Search contacts with advanced filters
 */
export async function searchContacts(
  userId: string,
  filters: SearchFilters = {},
  options: SearchOptions = {}
): Promise<SearchResult> {
  try {
    const {
      query,
      favorites,
      tags,
      hasEmail,
      hasPhone,
      company,
      recentlyAdded,
    } = filters;

    const {
      limit = 50,
      offset = 0,
      sortBy = 'name',
      sortOrder = 'asc',
    } = options;

    // Build where conditions
    const conditions = [eq(contacts.userId, userId)];

    // Text search across multiple fields
    if (query) {
      const searchTerm = `%${query}%`;
      conditions.push(
        or(
          ilike(contacts.firstName, searchTerm),
          ilike(contacts.lastName, searchTerm),
          ilike(contacts.displayName, searchTerm),
          ilike(contacts.nickname, searchTerm),
          ilike(contacts.company, searchTerm),
          ilike(contacts.jobTitle, searchTerm),
          ilike(contacts.notes, searchTerm)
        )!
      );
    }

    // Filter by favorites
    if (favorites) {
      conditions.push(eq(contacts.isFavorite, true));
    }

    // Filter by company
    if (company) {
      conditions.push(ilike(contacts.company, `%${company}%`));
    }

    // Filter by recently added
    if (recentlyAdded) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - recentlyAdded);
      conditions.push(sql`${contacts.createdAt} >= ${cutoffDate}`);
    }

    // Determine sort order
    let orderColumn;
    if (sortBy === 'name') {
      orderColumn =
        sortOrder === 'asc'
          ? asc(contacts.firstName)
          : desc(contacts.firstName);
    } else if (sortBy === 'company') {
      orderColumn =
        sortOrder === 'asc' ? asc(contacts.company) : desc(contacts.company);
    } else if (sortBy === 'recent') {
      orderColumn = desc(contacts.createdAt);
    } else if (sortBy === 'contacted') {
      orderColumn = desc(contacts.lastContactedAt);
    } else {
      orderColumn = asc(contacts.firstName); // default
    }

    // Execute query with filters and sorting
    const results = await db
      .select()
      .from(contacts)
      .where(and(...conditions))
      .orderBy(orderColumn)
      .limit(limit)
      .offset(offset);

    // If filtering by tags, do a second pass
    let filteredResults = results;
    if (tags && tags.length > 0) {
      const contactsWithTags = await db
        .select({ contactId: contactTagAssignments.contactId })
        .from(contactTagAssignments)
        .innerJoin(contactTags, eq(contactTagAssignments.tagId, contactTags.id))
        .where(
          and(
            eq(contactTags.userId, userId),
            sql`${contactTags.name} = ANY(${tags})`
          )
        );

      const taggedContactIds = new Set(
        contactsWithTags.map((c) => c.contactId)
      );
      filteredResults = results.filter((contact) =>
        taggedContactIds.has(contact.id)
      );
    }

    // If filtering by email/phone, check related tables
    if (hasEmail || hasPhone) {
      const contactIds = filteredResults.map((c) => c.id);

      if (hasEmail) {
        const contactsWithEmails = await db
          .select({ contactId: contactEmails.contactId })
          .from(contactEmails)
          .where(sql`${contactEmails.contactId} = ANY(${contactIds})`);

        const emailContactIds = new Set(
          contactsWithEmails.map((c) => c.contactId)
        );
        filteredResults = filteredResults.filter((contact) =>
          emailContactIds.has(contact.id)
        );
      }

      if (hasPhone) {
        const contactsWithPhones = await db
          .select({ contactId: contactPhones.contactId })
          .from(contactPhones)
          .where(sql`${contactPhones.contactId} = ANY(${contactIds})`);

        const phoneContactIds = new Set(
          contactsWithPhones.map((c) => c.contactId)
        );
        filteredResults = filteredResults.filter((contact) =>
          phoneContactIds.has(contact.id)
        );
      }
    }

    return {
      contacts: filteredResults,
      total: filteredResults.length,
    };
  } catch (error) {
    console.error('Error searching contacts:', error);
    return { contacts: [], total: 0 };
  }
}

/**
 * Quick search for autocomplete
 */
export async function quickSearch(
  userId: string,
  query: string,
  limit: number = 10
): Promise<Contact[]> {
  const result = await searchContacts(
    userId,
    { query },
    { limit, sortBy: 'name' }
  );
  return result.contacts;
}

/**
 * Search contacts by email address
 */
export async function searchByEmail(
  userId: string,
  email: string
): Promise<Contact | null> {
  try {
    const result = await db
      .select({ contactId: contactEmails.contactId })
      .from(contactEmails)
      .where(ilike(contactEmails.email, email))
      .limit(1);

    if (result.length === 0) return null;

    const [contact] = await db
      .select()
      .from(contacts)
      .where(
        and(eq(contacts.id, result[0].contactId), eq(contacts.userId, userId))
      )
      .limit(1);

    return contact || null;
  } catch (error) {
    console.error('Error searching by email:', error);
    return null;
  }
}
