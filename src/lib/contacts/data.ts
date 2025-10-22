'use server';

import { db } from '@/lib/db';
import {
  contacts,
  contactEmails,
  contactPhones,
  contactAddresses,
  contactSocialLinks,
  contactTags,
  contactTagAssignments,
  contactCustomFields,
  contactNotes,
} from '@/db/schema';
import { eq, and, or, desc, asc, sql, inArray, isNull } from 'drizzle-orm';
import type {
  Contact,
  ContactEmail,
  ContactPhone,
  ContactAddress,
  ContactSocialLink,
  ContactTag,
  ContactCustomField,
  ContactNote,
} from '@/db/schema';

// ============================================================================
// FULL CONTACT WITH ALL RELATED DATA
// ============================================================================

export interface ContactDetails extends Contact {
  emails: ContactEmail[];
  phones: ContactPhone[];
  addresses: ContactAddress[];
  socialLinks: ContactSocialLink[];
  tags: ContactTag[];
  customFields: ContactCustomField[];
  notesList: ContactNote[]; // Renamed from 'notes' to avoid conflict with Contact.notes
}

/**
 * Get full contact details with all related data
 */
export async function getContactDetails(
  contactId: string,
  userId: string
): Promise<ContactDetails | null> {
  try {
    // Get main contact
    const [contact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)))
      .limit(1);

    if (!contact) return null;

    // Get all related data in parallel
    const [emails, phones, addresses, socialLinks, customFields, notes] =
      await Promise.all([
        db
          .select()
          .from(contactEmails)
          .where(eq(contactEmails.contactId, contactId))
          .orderBy(desc(contactEmails.isPrimary)),

        db
          .select()
          .from(contactPhones)
          .where(eq(contactPhones.contactId, contactId))
          .orderBy(desc(contactPhones.isPrimary)),

        db
          .select()
          .from(contactAddresses)
          .where(eq(contactAddresses.contactId, contactId))
          .orderBy(desc(contactAddresses.isPrimary)),

        db
          .select()
          .from(contactSocialLinks)
          .where(eq(contactSocialLinks.contactId, contactId)),

        db
          .select()
          .from(contactCustomFields)
          .where(eq(contactCustomFields.contactId, contactId)),

        db
          .select()
          .from(contactNotes)
          .where(eq(contactNotes.contactId, contactId))
          .orderBy(desc(contactNotes.createdAt)),
      ]);

    // Get tags
    const tagAssignments = await db
      .select()
      .from(contactTagAssignments)
      .where(eq(contactTagAssignments.contactId, contactId));

    const tagIds = tagAssignments.map((ta) => ta.tagId);

    const tags =
      tagIds.length > 0
        ? await db
            .select()
            .from(contactTags)
            .where(inArray(contactTags.id, tagIds))
        : [];

    return {
      ...contact,
      emails,
      phones,
      addresses,
      socialLinks,
      tags,
      customFields,
      notesList: notes,
    };
  } catch (error) {
    console.error('Error fetching contact details:', error);
    return null;
  }
}

// ============================================================================
// LIST CONTACTS WITH FILTERS
// ============================================================================

export interface ContactListItem extends Contact {
  primaryEmail: string | null;
  primaryPhone: string | null;
  tags: ContactTag[];
  groups?: Array<{ id: string; name: string; color: string }>;
}

export interface ListContactsOptions {
  search?: string;
  favorites?: boolean;
  archived?: boolean;
  tags?: string[]; // tag IDs
  noTags?: boolean;
  hasAvatar?: boolean;
  sortBy?:
    | 'name_asc'
    | 'name_desc'
    | 'company_asc'
    | 'last_contacted_desc'
    | 'recently_added';
  page?: number;
  perPage?: number;
}

export interface ListContactsResult {
  contacts: ContactListItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/**
 * List contacts with filters, search, and pagination
 */
export async function getContactsList(
  userId: string,
  options: ListContactsOptions = {}
): Promise<ListContactsResult> {
  try {
    console.log('📋 getContactsList called with userId:', userId);
    console.log('📋 Options:', options);

    const {
      search,
      favorites,
      archived = false,
      tags: tagIds,
      noTags,
      hasAvatar,
      sortBy = 'name_asc',
      page = 1,
      perPage = 50,
    } = options;

    // Build base query conditions
    const conditions = [eq(contacts.userId, userId)];

    console.log('📋 Base condition - userId:', userId);

    // Filter by archived status
    conditions.push(eq(contacts.isArchived, archived));

    console.log('📋 Filtering by archived:', archived);

    // Filter by favorites
    if (favorites) {
      conditions.push(eq(contacts.isFavorite, true));
    }

    // Filter by avatar presence
    if (hasAvatar !== undefined) {
      if (hasAvatar) {
        conditions.push(sql`${contacts.avatarUrl} IS NOT NULL`);
      } else {
        conditions.push(isNull(contacts.avatarUrl));
      }
    }

    // Search across multiple fields
    if (search && search.trim().length > 0) {
      const searchTerm = `%${search.toLowerCase()}%`;
      conditions.push(
        or(
          sql`LOWER(${contacts.firstName}) LIKE ${searchTerm}`,
          sql`LOWER(${contacts.lastName}) LIKE ${searchTerm}`,
          sql`LOWER(${contacts.displayName}) LIKE ${searchTerm}`,
          sql`LOWER(${contacts.company}) LIKE ${searchTerm}`,
          sql`LOWER(${contacts.jobTitle}) LIKE ${searchTerm}`
        )!
      );
    }

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contacts)
      .where(and(...conditions));

    const total = Number(count);

    console.log('📋 Total count from query:', total);
    console.log('📋 Query conditions:', conditions.length, 'conditions');

    const totalPages = Math.ceil(total / perPage);
    const offset = (page - 1) * perPage;

    // Build sort order
    let orderBy: any;
    switch (sortBy) {
      case 'name_desc':
        orderBy = [desc(contacts.firstName), desc(contacts.lastName)];
        break;
      case 'company_asc':
        orderBy = [asc(contacts.company)];
        break;
      case 'last_contacted_desc':
        orderBy = [desc(contacts.lastContactedAt)];
        break;
      case 'recently_added':
        orderBy = [desc(contacts.createdAt)];
        break;
      case 'name_asc':
      default:
        orderBy = [asc(contacts.firstName), asc(contacts.lastName)];
        break;
    }

    // Fetch contacts
    const contactsList = await db
      .select()
      .from(contacts)
      .where(and(...conditions))
      .orderBy(...orderBy)
      .limit(perPage)
      .offset(offset);

    // Get primary emails and phones for each contact
    const contactIds = contactsList.map((c) => c.id);

    const [allEmails, allPhones, allTagAssignments] = await Promise.all([
      contactIds.length > 0
        ? db
            .select()
            .from(contactEmails)
            .where(inArray(contactEmails.contactId, contactIds))
            .orderBy(desc(contactEmails.isPrimary))
        : [],
      contactIds.length > 0
        ? db
            .select()
            .from(contactPhones)
            .where(inArray(contactPhones.contactId, contactIds))
            .orderBy(desc(contactPhones.isPrimary))
        : [],
      contactIds.length > 0
        ? db
            .select()
            .from(contactTagAssignments)
            .where(inArray(contactTagAssignments.contactId, contactIds))
        : [],
    ]);

    // Get all unique tag IDs
    const allTagIds = Array.from(
      new Set(allTagAssignments.map((ta) => ta.tagId))
    );

    // Fetch all tags
    const allTags =
      allTagIds.length > 0
        ? await db
            .select()
            .from(contactTags)
            .where(inArray(contactTags.id, allTagIds))
        : [];

    // Map tags by ID for quick lookup
    const tagsById = new Map(allTags.map((tag) => [tag.id, tag]));

    // Build contact list items with primary email/phone and tags
    const contactsWithDetails: ContactListItem[] = contactsList.map(
      (contact) => {
        const emails = allEmails.filter((e) => e.contactId === contact.id);
        const phones = allPhones.filter((p) => p.contactId === contact.id);
        const tagAssignments = allTagAssignments.filter(
          (ta) => ta.contactId === contact.id
        );
        const tags = tagAssignments
          .map((ta) => tagsById.get(ta.tagId))
          .filter(Boolean) as ContactTag[];

        return {
          ...contact,
          primaryEmail: emails[0]?.email || null,
          primaryPhone: phones[0]?.phone || null,
          tags,
        };
      }
    );

    // Apply tag filters if specified
    let filteredContacts = contactsWithDetails;

    if (tagIds && tagIds.length > 0) {
      filteredContacts = contactsWithDetails.filter((contact) =>
        contact.tags.some((tag) => tagIds.includes(tag.id))
      );
    }

    if (noTags) {
      filteredContacts = contactsWithDetails.filter(
        (contact) => contact.tags.length === 0
      );
    }

    return {
      contacts: filteredContacts,
      total,
      page,
      perPage,
      totalPages,
    };
  } catch (error) {
    console.error('Error listing contacts:', error);
    return {
      contacts: [],
      total: 0,
      page: 1,
      perPage: options.perPage || 50,
      totalPages: 0,
    };
  }
}

// ============================================================================
// GET CONTACT BY EMAIL
// ============================================================================

/**
 * Find contact by any of their email addresses
 */
export async function getContactByEmail(
  email: string,
  userId: string
): Promise<Contact | null> {
  try {
    const [contactEmail] = await db
      .select()
      .from(contactEmails)
      .where(eq(contactEmails.email, email.toLowerCase()))
      .limit(1);

    if (!contactEmail) return null;

    const [contact] = await db
      .select()
      .from(contacts)
      .where(
        and(
          eq(contacts.id, contactEmail.contactId),
          eq(contacts.userId, userId)
        )
      )
      .limit(1);

    return contact || null;
  } catch (error) {
    console.error('Error finding contact by email:', error);
    return null;
  }
}

// ============================================================================
// GET CONTACT STATS
// ============================================================================

export interface ContactStats {
  totalContacts: number;
  totalFavorites: number;
  recentAdditions: number; // Last 7 days
}

/**
 * Get contact statistics for a user
 */
export async function getContactStats(userId: string): Promise<ContactStats> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [totalResult, favoritesResult, recentResult] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(contacts)
        .where(
          and(eq(contacts.userId, userId), eq(contacts.isArchived, false))
        ),

      db
        .select({ count: sql<number>`count(*)` })
        .from(contacts)
        .where(
          and(
            eq(contacts.userId, userId),
            eq(contacts.isFavorite, true),
            eq(contacts.isArchived, false)
          )
        ),

      db
        .select({ count: sql<number>`count(*)` })
        .from(contacts)
        .where(
          and(
            eq(contacts.userId, userId),
            eq(contacts.isArchived, false),
            sql`${contacts.createdAt} >= ${sevenDaysAgo.toISOString()}`
          )
        ),
    ]);

    return {
      totalContacts: Number(totalResult[0]?.count || 0),
      totalFavorites: Number(favoritesResult[0]?.count || 0),
      recentAdditions: Number(recentResult[0]?.count || 0),
    };
  } catch (error) {
    console.error('Error fetching contact stats:', error);
    return {
      totalContacts: 0,
      totalFavorites: 0,
      recentAdditions: 0,
    };
  }
}
