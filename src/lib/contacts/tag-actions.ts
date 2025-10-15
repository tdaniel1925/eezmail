'use server';

import { db } from '@/lib/db';
import { contactTags, contactTagAssignments, contacts } from '@/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type { ContactTag, NewContactTag } from '@/db/schema';
import {
  CreateTagSchema,
  UpdateTagSchema,
  type CreateTagInput,
  type UpdateTagInput,
} from './validation';

// ============================================================================
// CREATE TAG
// ============================================================================

export async function createTag(
  userId: string,
  data: CreateTagInput
): Promise<{ success: boolean; tagId?: string; error?: string }> {
  try {
    // Validate input
    const validated = CreateTagSchema.parse(data);

    // Check for duplicate name (case-insensitive)
    const [existing] = await db
      .select()
      .from(contactTags)
      .where(
        and(
          eq(contactTags.userId, userId),
          sql`LOWER(${contactTags.name}) = LOWER(${validated.name})`
        )
      )
      .limit(1);

    if (existing) {
      return { success: false, error: 'A tag with this name already exists' };
    }

    // Create tag
    const newTag = {
      userId,
      name: validated.name,
      color: validated.color,
    };

    const [createdTag] = await db
      .insert(contactTags)
      .values(newTag as NewContactTag)
      .returning();

    revalidatePath('/dashboard/contacts');
    return { success: true, tagId: createdTag.id };
  } catch (error) {
    console.error('Error creating tag:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create tag' };
  }
}

// ============================================================================
// UPDATE TAG
// ============================================================================

export async function updateTag(
  tagId: string,
  userId: string,
  data: UpdateTagInput
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const validated = UpdateTagSchema.parse(data);

    // Verify ownership
    const [existing] = await db
      .select()
      .from(contactTags)
      .where(and(eq(contactTags.id, tagId), eq(contactTags.userId, userId)))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Tag not found' };
    }

    // Check for duplicate name if name is being updated
    if (validated.name) {
      const [duplicate] = await db
        .select()
        .from(contactTags)
        .where(
          and(
            eq(contactTags.userId, userId),
            sql`LOWER(${contactTags.name}) = LOWER(${validated.name})`,
            sql`${contactTags.id} != ${tagId}`
          )
        )
        .limit(1);

      if (duplicate) {
        return {
          success: false,
          error: 'A tag with this name already exists',
        };
      }
    }

    // Update tag
    await db
      .update(contactTags)
      .set(validated)
      .where(eq(contactTags.id, tagId));

    revalidatePath('/dashboard/contacts');
    return { success: true };
  } catch (error) {
    console.error('Error updating tag:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update tag' };
  }
}

// ============================================================================
// DELETE TAG
// ============================================================================

export async function deleteTag(
  tagId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify ownership
    const [existing] = await db
      .select()
      .from(contactTags)
      .where(and(eq(contactTags.id, tagId), eq(contactTags.userId, userId)))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Tag not found' };
    }

    // Delete tag (assignments will be cascade deleted)
    await db.delete(contactTags).where(eq(contactTags.id, tagId));

    revalidatePath('/dashboard/contacts');
    return { success: true };
  } catch (error) {
    console.error('Error deleting tag:', error);
    return { success: false, error: 'Failed to delete tag' };
  }
}

// ============================================================================
// ASSIGN TAGS TO CONTACT
// ============================================================================

export async function assignTags(
  contactId: string,
  userId: string,
  tagIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify contact ownership
    const [contact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)))
      .limit(1);

    if (!contact) {
      return { success: false, error: 'Contact not found' };
    }

    // Verify all tags belong to user
    if (tagIds.length > 0) {
      const tags = await db
        .select()
        .from(contactTags)
        .where(
          and(inArray(contactTags.id, tagIds), eq(contactTags.userId, userId))
        );

      if (tags.length !== tagIds.length) {
        return { success: false, error: 'One or more tags not found' };
      }
    }

    // Remove existing tag assignments
    await db
      .delete(contactTagAssignments)
      .where(eq(contactTagAssignments.contactId, contactId));

    // Add new tag assignments
    if (tagIds.length > 0) {
      const assignments = tagIds.map((tagId) => ({
        contactId,
        tagId,
      }));
      await db.insert(contactTagAssignments).values(assignments);
    }

    revalidatePath('/dashboard/contacts');
    return { success: true };
  } catch (error) {
    console.error('Error assigning tags:', error);
    return { success: false, error: 'Failed to assign tags' };
  }
}

// ============================================================================
// REMOVE TAG FROM CONTACT
// ============================================================================

export async function removeTag(
  contactId: string,
  userId: string,
  tagId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify contact ownership
    const [contact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)))
      .limit(1);

    if (!contact) {
      return { success: false, error: 'Contact not found' };
    }

    // Remove tag assignment
    await db
      .delete(contactTagAssignments)
      .where(
        and(
          eq(contactTagAssignments.contactId, contactId),
          eq(contactTagAssignments.tagId, tagId)
        )
      );

    revalidatePath('/dashboard/contacts');
    return { success: true };
  } catch (error) {
    console.error('Error removing tag:', error);
    return { success: false, error: 'Failed to remove tag' };
  }
}

// ============================================================================
// LIST USER'S TAGS
// ============================================================================

export interface TagWithCount extends ContactTag {
  contactCount: number;
}

export async function listTags(userId: string): Promise<TagWithCount[]> {
  try {
    // Get all tags for user
    const tags = await db
      .select()
      .from(contactTags)
      .where(eq(contactTags.userId, userId))
      .orderBy(contactTags.name);

    // Get contact counts for each tag
    const tagIds = tags.map((t) => t.id);

    if (tagIds.length === 0) {
      return [];
    }

    const counts = await db
      .select({
        tagId: contactTagAssignments.tagId,
        count: sql<number>`count(*)`,
      })
      .from(contactTagAssignments)
      .where(inArray(contactTagAssignments.tagId, tagIds))
      .groupBy(contactTagAssignments.tagId);

    const countsMap = new Map(counts.map((c) => [c.tagId, Number(c.count)]));

    return tags.map((tag) => ({
      ...tag,
      contactCount: countsMap.get(tag.id) || 0,
    }));
  } catch (error) {
    console.error('Error listing tags:', error);
    return [];
  }
}
