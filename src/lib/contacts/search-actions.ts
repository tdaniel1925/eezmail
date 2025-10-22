'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { contacts, contactGroups, contactGroupMembers, contactEmails } from '@/db/schema';
import { eq, and, or, ilike, sql, desc } from 'drizzle-orm';

export interface ContactSearchResult {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isFrequent?: boolean;
  lastContactedAt?: Date;
}

export interface GroupSearchResult {
  id: string;
  name: string;
  color: string;
  memberCount: number;
  memberEmails: string[];
}

export interface SearchResults {
  success: boolean;
  contacts?: ContactSearchResult[];
  groups?: GroupSearchResult[];
  error?: string;
}

/**
 * Search contacts and groups for recipient autocomplete
 */
export async function searchRecipientsAction(
  query: string,
  limit: number = 10
): Promise<SearchResults> {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // If query is empty, return recent/frequent contacts
    if (!query || query.trim().length === 0) {
      return await getRecentContacts(user.id, limit);
    }

    const searchTerm = `%${query.trim()}%`;

    // Search contacts by name or email
    const contactResults = await db
      .select({
        contactId: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        displayName: contacts.displayName,
        email: contactEmails.email,
        avatarUrl: contacts.avatarUrl,
        lastContactedAt: contacts.lastContactedAt,
      })
      .from(contacts)
      .leftJoin(contactEmails, eq(contactEmails.contactId, contacts.id))
      .where(
        and(
          eq(contacts.userId, user.id),
          or(
            ilike(contacts.firstName, searchTerm),
            ilike(contacts.lastName, searchTerm),
            ilike(contacts.displayName, searchTerm),
            ilike(contactEmails.email, searchTerm)
          )
        )
      )
      .orderBy(desc(contacts.lastContactedAt))
      .limit(limit);

    // Format contact results
    const contactsFormatted: ContactSearchResult[] = contactResults
      .filter((c) => c.email) // Only include contacts with emails
      .map((c) => ({
        id: c.contactId,
        name: c.displayName || `${c.firstName} ${c.lastName}`.trim() || 'Unknown',
        email: c.email!,
        avatarUrl: c.avatarUrl || undefined,
        lastContactedAt: c.lastContactedAt || undefined,
      }));

    // Search groups by name
    const groupResults = await db
      .select({
        id: contactGroups.id,
        name: contactGroups.name,
        color: contactGroups.color,
      })
      .from(contactGroups)
      .where(
        and(
          eq(contactGroups.userId, user.id),
          ilike(contactGroups.name, searchTerm)
        )
      )
      .limit(5);

    // Get member counts and emails for each group
    const groupsFormatted: GroupSearchResult[] = await Promise.all(
      groupResults.map(async (group) => {
        // Get group members with their emails
        const members = await db
          .select({
            email: contactEmails.email,
          })
          .from(contactGroupMembers)
          .leftJoin(contacts, eq(contactGroupMembers.contactId, contacts.id))
          .leftJoin(contactEmails, eq(contactEmails.contactId, contacts.id))
          .where(eq(contactGroupMembers.groupId, group.id));

        const memberEmails = members
          .map((m) => m.email)
          .filter((email): email is string => email !== null);

        return {
          id: group.id,
          name: group.name,
          color: group.color || '#3B82F6',
          memberCount: memberEmails.length,
          memberEmails,
        };
      })
    );

    return {
      success: true,
      contacts: contactsFormatted,
      groups: groupsFormatted,
    };
  } catch (error) {
    console.error('Error searching recipients:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search recipients',
    };
  }
}

/**
 * Get recent/frequent contacts (when no search query)
 */
async function getRecentContacts(
  userId: string,
  limit: number
): Promise<SearchResults> {
  try {
    // Get contacts ordered by last contacted date
    const recentContacts = await db
      .select({
        contactId: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        displayName: contacts.displayName,
        email: contactEmails.email,
        avatarUrl: contacts.avatarUrl,
        lastContactedAt: contacts.lastContactedAt,
      })
      .from(contacts)
      .leftJoin(contactEmails, eq(contactEmails.contactId, contacts.id))
      .where(eq(contacts.userId, userId))
      .orderBy(desc(contacts.lastContactedAt))
      .limit(limit);

    const contactsFormatted: ContactSearchResult[] = recentContacts
      .filter((c) => c.email) // Only include contacts with emails
      .map((c) => ({
        id: c.contactId,
        name: c.displayName || `${c.firstName} ${c.lastName}`.trim() || 'Unknown',
        email: c.email!,
        avatarUrl: c.avatarUrl || undefined,
        isFrequent: true,
        lastContactedAt: c.lastContactedAt || undefined,
      }));

    return {
      success: true,
      contacts: contactsFormatted,
      groups: [],
    };
  } catch (error) {
    console.error('Error getting recent contacts:', error);
    return {
      success: false,
      error: 'Failed to get recent contacts',
    };
  }
}

/**
 * Validate an email address format
 * Note: This is a regular function, not a server action
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

