import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  addMembersToGroup,
  removeMembersFromGroup,
} from '@/lib/contacts/groups';
import { z } from 'zod';

const membersSchema = z.object({
  contactIds: z.array(z.string()).min(1),
});

interface RouteContext {
  params: Promise<{
    groupId: string;
  }>;
}

/**
 * POST /api/contacts/groups/[groupId]/members
 * Add contacts to a group (bulk operation)
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await context.params;
    const body = await request.json();
    const { contactIds } = membersSchema.parse(body);

    const result = await addMembersToGroup(groupId, contactIds, user.id);

    return NextResponse.json({
      success: true,
      added: result.success,
      errors: result.errors,
      message: `Added ${result.success} contact(s) to group`,
    });
  } catch (error) {
    console.error('Error adding members to group:', error);

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
      { error: 'Failed to add members to group' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contacts/groups/[groupId]/members
 * Remove contacts from a group (bulk operation)
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await context.params;
    const body = await request.json();
    const { contactIds } = membersSchema.parse(body);

    const result = await removeMembersFromGroup(groupId, contactIds, user.id);

    return NextResponse.json({
      success: true,
      removed: result.success,
      message: `Removed ${result.success} contact(s) from group`,
    });
  } catch (error) {
    console.error('Error removing members from group:', error);

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
      { error: 'Failed to remove members from group' },
      { status: 500 }
    );
  }
}

