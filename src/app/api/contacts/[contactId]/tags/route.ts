import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { assignTags, removeTags } from '@/lib/contacts/tags';
import { z } from 'zod';

const tagsSchema = z.object({
  tagIds: z.array(z.string()).min(1),
});

interface RouteContext {
  params: Promise<{
    contactId: string;
  }>;
}

/**
 * POST /api/contacts/[contactId]/tags
 * Assign tags to a contact
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

    const { contactId } = await context.params;
    const body = await request.json();
    const { tagIds } = tagsSchema.parse(body);

    const result = await assignTags(contactId, tagIds, user.id);

    return NextResponse.json({
      success: true,
      assigned: result.success,
      errors: result.errors,
      message: `Assigned ${result.success} tag(s) to contact`,
    });
  } catch (error) {
    console.error('Error assigning tags:', error);

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
      { error: 'Failed to assign tags' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contacts/[contactId]/tags
 * Remove tags from a contact
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

    const { contactId } = await context.params;
    const body = await request.json();
    const { tagIds } = tagsSchema.parse(body);

    const result = await removeTags(contactId, tagIds, user.id);

    return NextResponse.json({
      success: true,
      removed: result.success,
      message: `Removed ${result.success} tag(s) from contact`,
    });
  } catch (error) {
    console.error('Error removing tags:', error);

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
      { error: 'Failed to remove tags' },
      { status: 500 }
    );
  }
}

