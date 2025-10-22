import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  addMembersToGroup,
  removeMembersFromGroup,
} from '@/lib/contacts/groups';
import { bulkAssignTag } from '@/lib/contacts/tags';
import { db } from '@/db/client';
import { contacts, contactTagAssignments } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import type { BulkActionResponse } from '@/types/contact-groups';

const bulkActionSchema = z.object({
  action: z.enum([
    'add-to-group',
    'remove-from-group',
    'add-tags',
    'remove-tags',
    'delete',
  ]),
  contactIds: z.array(z.string()).min(1),
  groupId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
});

/**
 * POST /api/contacts/bulk
 * Perform bulk operations on multiple contacts
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = bulkActionSchema.parse(body);
    const { action, contactIds, groupId, tagIds } = validatedData;

    let result: BulkActionResponse = {
      success: false,
      affectedCount: 0,
    };

    switch (action) {
      case 'add-to-group':
        if (!groupId) {
          return NextResponse.json(
            { error: 'groupId is required for add-to-group action' },
            { status: 400 }
          );
        }
        const addResult = await addMembersToGroup(groupId, contactIds, user.id);
        result = {
          success: true,
          affectedCount: addResult.success,
        };
        break;

      case 'remove-from-group':
        if (!groupId) {
          return NextResponse.json(
            { error: 'groupId is required for remove-from-group action' },
            { status: 400 }
          );
        }
        const removeResult = await removeMembersFromGroup(
          groupId,
          contactIds,
          user.id
        );
        result = {
          success: true,
          affectedCount: removeResult.success,
        };
        break;

      case 'add-tags':
        if (!tagIds || tagIds.length === 0) {
          return NextResponse.json(
            { error: 'tagIds is required for add-tags action' },
            { status: 400 }
          );
        }
        // Bulk assign tags to multiple contacts
        let totalAssigned = 0;
        const assignErrors: Array<{ contactId: string; error: string }> = [];

        for (const tagId of tagIds) {
          try {
            const tagResult = await bulkAssignTag(tagId, contactIds, user.id);
            totalAssigned += tagResult.success;
          } catch (error) {
            assignErrors.push({
              contactId: 'multiple',
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        result = {
          success: true,
          affectedCount: totalAssigned,
          errors: assignErrors.length > 0 ? assignErrors : undefined,
        };
        break;

      case 'remove-tags':
        if (!tagIds || tagIds.length === 0) {
          return NextResponse.json(
            { error: 'tagIds is required for remove-tags action' },
            { status: 400 }
          );
        }
        // Bulk remove tags using direct DB operation
        const deleteTagResult = await db
          .delete(contactTagAssignments)
          .where(
            and(
              inArray(contactTagAssignments.contactId, contactIds),
              inArray(contactTagAssignments.tagId, tagIds)
            )
          )
          .returning();

        result = {
          success: true,
          affectedCount: deleteTagResult.length,
        };
        break;

      case 'delete':
        // Delete multiple contacts
        const deleted = await db
          .delete(contacts)
          .where(
            and(eq(contacts.userId, user.id), inArray(contacts.id, contactIds))
          )
          .returning();

        result = {
          success: true,
          affectedCount: deleted.length,
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error performing bulk action:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}
