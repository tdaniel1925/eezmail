'use server';

import { db } from '@/lib/db';
import {
  contactGroups,
  contactGroupMembers,
  contacts,
  contactEmails,
} from '@/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import type {
  ContactGroup,
  ContactGroupWithCount,
  CreateGroupRequest,
  UpdateGroupRequest,
  ContactWithGroupsAndTags,
} from '@/types/contact-groups';

/**
 * Get all groups for a user with member counts
 */
export async function getGroups(
  userId: string
): Promise<ContactGroupWithCount[]> {
  const groupsWithCounts = await db
    .select({
      id: contactGroups.id,
      userId: contactGroups.userId,
      name: contactGroups.name,
      description: contactGroups.description,
      color: contactGroups.color,
      isFavorite: contactGroups.isFavorite,
      createdAt: contactGroups.createdAt,
      updatedAt: contactGroups.updatedAt,
      memberCount: sql<number>`cast(count(${contactGroupMembers.id}) as int)`,
    })
    .from(contactGroups)
    .leftJoin(
      contactGroupMembers,
      eq(contactGroups.id, contactGroupMembers.groupId)
    )
    .where(eq(contactGroups.userId, userId))
    .groupBy(contactGroups.id)
    .orderBy(contactGroups.isFavorite, contactGroups.name);

  return groupsWithCounts as ContactGroupWithCount[];
}

/**
 * Get a single group by ID with all its members
 */
export async function getGroupById(
  groupId: string,
  userId: string
): Promise<
  | (ContactGroup & {
      members: Array<{
        id: string;
        contactId: string;
        firstName?: string | null;
        lastName?: string | null;
        displayName?: string | null;
        company?: string | null;
        email?: string | null;
      }>;
    })
  | null
> {
  // Get the group
  const group = await db.query.contactGroups.findFirst({
    where: and(eq(contactGroups.id, groupId), eq(contactGroups.userId, userId)),
  });

  if (!group) {
    return null;
  }

  // Get all members with their basic info
  const members = await db
    .select({
      id: contactGroupMembers.id,
      contactId: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      displayName: contacts.displayName,
      company: contacts.company,
      email: contactEmails.email,
    })
    .from(contactGroupMembers)
    .innerJoin(contacts, eq(contactGroupMembers.contactId, contacts.id))
    .leftJoin(
      contactEmails,
      and(
        eq(contactEmails.contactId, contacts.id),
        eq(contactEmails.isPrimary, true)
      )
    )
    .where(eq(contactGroupMembers.groupId, groupId));

  return {
    ...group,
    members,
  };
}

/**
 * Create a new group
 */
export async function createGroup(
  userId: string,
  data: CreateGroupRequest
): Promise<ContactGroup> {
  const [newGroup] = await db
    .insert(contactGroups)
    .values({
      userId,
      name: data.name,
      description: data.description,
      color: data.color || '#3B82F6',
      isFavorite: data.isFavorite || false,
    })
    .returning();

  // Add initial members if provided
  if (data.memberIds && data.memberIds.length > 0) {
    await addMembersToGroup(newGroup.id, data.memberIds, userId);
  }

  return newGroup;
}

/**
 * Update an existing group
 */
export async function updateGroup(
  groupId: string,
  userId: string,
  data: UpdateGroupRequest
): Promise<ContactGroup | null> {
  const [updatedGroup] = await db
    .update(contactGroups)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(contactGroups.id, groupId), eq(contactGroups.userId, userId)))
    .returning();

  return updatedGroup || null;
}

/**
 * Delete a group (cascade deletes members)
 */
export async function deleteGroup(
  groupId: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .delete(contactGroups)
    .where(and(eq(contactGroups.id, groupId), eq(contactGroups.userId, userId)))
    .returning();

  return result.length > 0;
}

/**
 * Add members to a group (bulk operation)
 */
export async function addMembersToGroup(
  groupId: string,
  contactIds: string[],
  userId: string
): Promise<{ success: number; errors: number }> {
  // Verify the group belongs to the user
  const group = await db.query.contactGroups.findFirst({
    where: and(eq(contactGroups.id, groupId), eq(contactGroups.userId, userId)),
  });

  if (!group) {
    throw new Error('Group not found or access denied');
  }

  // Verify all contacts belong to the user
  const userContacts = await db
    .select({ id: contacts.id })
    .from(contacts)
    .where(and(eq(contacts.userId, userId), inArray(contacts.id, contactIds)));

  const validContactIds = userContacts.map((c) => c.id);

  if (validContactIds.length === 0) {
    return { success: 0, errors: contactIds.length };
  }

  // Get existing memberships to avoid duplicates
  const existingMembers = await db
    .select({ contactId: contactGroupMembers.contactId })
    .from(contactGroupMembers)
    .where(
      and(
        eq(contactGroupMembers.groupId, groupId),
        inArray(contactGroupMembers.contactId, validContactIds)
      )
    );

  const existingContactIds = new Set(existingMembers.map((m) => m.contactId));
  const newContactIds = validContactIds.filter(
    (id) => !existingContactIds.has(id)
  );

  if (newContactIds.length > 0) {
    await db.insert(contactGroupMembers).values(
      newContactIds.map((contactId) => ({
        groupId,
        contactId,
      }))
    );
  }

  return {
    success: newContactIds.length,
    errors: contactIds.length - newContactIds.length,
  };
}

/**
 * Remove members from a group (bulk operation)
 */
export async function removeMembersFromGroup(
  groupId: string,
  contactIds: string[],
  userId: string
): Promise<{ success: number }> {
  // Verify the group belongs to the user
  const group = await db.query.contactGroups.findFirst({
    where: and(eq(contactGroups.id, groupId), eq(contactGroups.userId, userId)),
  });

  if (!group) {
    throw new Error('Group not found or access denied');
  }

  const result = await db
    .delete(contactGroupMembers)
    .where(
      and(
        eq(contactGroupMembers.groupId, groupId),
        inArray(contactGroupMembers.contactId, contactIds)
      )
    )
    .returning();

  return { success: result.length };
}

/**
 * Get all groups a contact belongs to
 */
export async function getContactGroups(
  contactId: string
): Promise<ContactGroup[]> {
  const groups = await db
    .select({
      id: contactGroups.id,
      userId: contactGroups.userId,
      name: contactGroups.name,
      description: contactGroups.description,
      color: contactGroups.color,
      isFavorite: contactGroups.isFavorite,
      createdAt: contactGroups.createdAt,
      updatedAt: contactGroups.updatedAt,
    })
    .from(contactGroups)
    .innerJoin(
      contactGroupMembers,
      eq(contactGroups.id, contactGroupMembers.groupId)
    )
    .where(eq(contactGroupMembers.contactId, contactId))
    .orderBy(contactGroups.name);

  return groups;
}

/**
 * Get all contact emails for a group (for email distribution)
 */
export async function getGroupContactEmails(
  groupId: string,
  userId: string
): Promise<Array<{ email: string; name?: string }>> {
  // Verify the group belongs to the user
  const group = await db.query.contactGroups.findFirst({
    where: and(eq(contactGroups.id, groupId), eq(contactGroups.userId, userId)),
  });

  if (!group) {
    throw new Error('Group not found or access denied');
  }

  const emails = await db
    .select({
      email: contactEmails.email,
      name: contacts.displayName,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
    })
    .from(contactGroupMembers)
    .innerJoin(contacts, eq(contactGroupMembers.contactId, contacts.id))
    .innerJoin(
      contactEmails,
      and(
        eq(contactEmails.contactId, contacts.id),
        eq(contactEmails.isPrimary, true)
      )
    )
    .where(eq(contactGroupMembers.groupId, groupId));

  return emails.map((e) => ({
    email: e.email,
    name:
      e.name ||
      [e.firstName, e.lastName].filter(Boolean).join(' ') ||
      undefined,
  }));
}
