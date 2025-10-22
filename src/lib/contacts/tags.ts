'use server';

import { db } from '@/lib/db';
import { contactTags, contactTagAssignments, contacts } from '@/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import type {
  ContactTag,
  ContactTagWithCount,
  CreateTagRequest,
  UpdateTagRequest,
} from '@/types/contact-groups';

/**
 * Get all tags for a user
 */
export async function getTags(userId: string): Promise<ContactTag[]> {
  const tags = await db
    .select()
    .from(contactTags)
    .where(eq(contactTags.userId, userId))
    .orderBy(contactTags.name);

  return tags;
}

/**
 * Get all tags for a user with usage counts
 */
export async function getTagsWithCounts(
  userId: string
): Promise<ContactTagWithCount[]> {
  const tagsWithCounts = await db
    .select({
      id: contactTags.id,
      userId: contactTags.userId,
      name: contactTags.name,
      color: contactTags.color,
      createdAt: contactTags.createdAt,
      usageCount: sql<number>`cast(count(${contactTagAssignments.id}) as int)`,
    })
    .from(contactTags)
    .leftJoin(
      contactTagAssignments,
      eq(contactTags.id, contactTagAssignments.tagId)
    )
    .where(eq(contactTags.userId, userId))
    .groupBy(contactTags.id)
    .orderBy(contactTags.name);

  return tagsWithCounts as ContactTagWithCount[];
}

/**
 * Create a new tag
 */
export async function createTag(
  userId: string,
  data: CreateTagRequest
): Promise<ContactTag> {
  const [newTag] = await db
    .insert(contactTags)
    .values({
      userId,
      name: data.name,
      color: data.color || '#10B981',
    })
    .returning();

  return newTag;
}

/**
 * Update an existing tag
 */
export async function updateTag(
  tagId: string,
  userId: string,
  data: UpdateTagRequest
): Promise<ContactTag | null> {
  const [updatedTag] = await db
    .update(contactTags)
    .set(data)
    .where(and(eq(contactTags.id, tagId), eq(contactTags.userId, userId)))
    .returning();

  return updatedTag || null;
}

/**
 * Delete a tag (cascade deletes assignments)
 */
export async function deleteTag(
  tagId: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .delete(contactTags)
    .where(and(eq(contactTags.id, tagId), eq(contactTags.userId, userId)))
    .returning();

  return result.length > 0;
}

/**
 * Assign multiple tags to a contact
 */
export async function assignTags(
  contactId: string,
  tagIds: string[],
  userId: string
): Promise<{ success: number; errors: number }> {
  // Verify the contact belongs to the user
  const contact = await db.query.contacts.findFirst({
    where: and(eq(contacts.id, contactId), eq(contacts.userId, userId)),
  });

  if (!contact) {
    throw new Error('Contact not found or access denied');
  }

  // Verify all tags belong to the user
  const userTags = await db
    .select({ id: contactTags.id })
    .from(contactTags)
    .where(
      and(eq(contactTags.userId, userId), inArray(contactTags.id, tagIds))
    );

  const validTagIds = userTags.map((t) => t.id);

  if (validTagIds.length === 0) {
    return { success: 0, errors: tagIds.length };
  }

  // Get existing assignments to avoid duplicates
  const existingAssignments = await db
    .select({ tagId: contactTagAssignments.tagId })
    .from(contactTagAssignments)
    .where(
      and(
        eq(contactTagAssignments.contactId, contactId),
        inArray(contactTagAssignments.tagId, validTagIds)
      )
    );

  const existingTagIds = new Set(existingAssignments.map((a) => a.tagId));
  const newTagIds = validTagIds.filter((id) => !existingTagIds.has(id));

  if (newTagIds.length > 0) {
    await db.insert(contactTagAssignments).values(
      newTagIds.map((tagId) => ({
        contactId,
        tagId,
      }))
    );
  }

  return {
    success: newTagIds.length,
    errors: tagIds.length - newTagIds.length,
  };
}

/**
 * Remove multiple tags from a contact
 */
export async function removeTags(
  contactId: string,
  tagIds: string[],
  userId: string
): Promise<{ success: number }> {
  // Verify the contact belongs to the user
  const contact = await db.query.contacts.findFirst({
    where: and(eq(contacts.id, contactId), eq(contacts.userId, userId)),
  });

  if (!contact) {
    throw new Error('Contact not found or access denied');
  }

  const result = await db
    .delete(contactTagAssignments)
    .where(
      and(
        eq(contactTagAssignments.contactId, contactId),
        inArray(contactTagAssignments.tagId, tagIds)
      )
    )
    .returning();

  return { success: result.length };
}

/**
 * Get all tags assigned to a contact
 */
export async function getContactTags(contactId: string): Promise<ContactTag[]> {
  const tags = await db
    .select({
      id: contactTags.id,
      userId: contactTags.userId,
      name: contactTags.name,
      color: contactTags.color,
      createdAt: contactTags.createdAt,
    })
    .from(contactTags)
    .innerJoin(
      contactTagAssignments,
      eq(contactTags.id, contactTagAssignments.tagId)
    )
    .where(eq(contactTagAssignments.contactId, contactId))
    .orderBy(contactTags.name);

  return tags;
}

/**
 * Get all contacts with a specific tag
 */
export async function getContactsByTag(
  tagId: string,
  userId: string
): Promise<
  Array<{
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    company?: string | null;
  }>
> {
  // Verify the tag belongs to the user
  const tag = await db.query.contactTags.findFirst({
    where: and(eq(contactTags.id, tagId), eq(contactTags.userId, userId)),
  });

  if (!tag) {
    throw new Error('Tag not found or access denied');
  }

  const tagContacts = await db
    .select({
      id: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      displayName: contacts.displayName,
      company: contacts.company,
    })
    .from(contactTagAssignments)
    .innerJoin(contacts, eq(contactTagAssignments.contactId, contacts.id))
    .where(eq(contactTagAssignments.tagId, tagId))
    .orderBy(contacts.displayName, contacts.firstName, contacts.lastName);

  return tagContacts;
}

/**
 * Bulk assign a tag to multiple contacts
 */
export async function bulkAssignTag(
  tagId: string,
  contactIds: string[],
  userId: string
): Promise<{ success: number; errors: number }> {
  // Verify the tag belongs to the user
  const tag = await db.query.contactTags.findFirst({
    where: and(eq(contactTags.id, tagId), eq(contactTags.userId, userId)),
  });

  if (!tag) {
    throw new Error('Tag not found or access denied');
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

  // Get existing assignments to avoid duplicates
  const existingAssignments = await db
    .select({ contactId: contactTagAssignments.contactId })
    .from(contactTagAssignments)
    .where(
      and(
        eq(contactTagAssignments.tagId, tagId),
        inArray(contactTagAssignments.contactId, validContactIds)
      )
    );

  const existingContactIds = new Set(
    existingAssignments.map((a) => a.contactId)
  );
  const newContactIds = validContactIds.filter(
    (id) => !existingContactIds.has(id)
  );

  if (newContactIds.length > 0) {
    await db.insert(contactTagAssignments).values(
      newContactIds.map((contactId) => ({
        contactId,
        tagId,
      }))
    );
  }

  return {
    success: newContactIds.length,
    errors: contactIds.length - newContactIds.length,
  };
}
