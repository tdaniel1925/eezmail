import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTagsWithCounts, createTag } from '@/lib/contacts/tags';
import { z } from 'zod';

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
});

/**
 * GET /api/contacts/tags
 * Fetch all tags for the current user with usage counts
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('❌ Tags API: No user authenticated');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Tags API: Fetching tags for user:', user.id);

    const tags = await getTagsWithCounts(user.id);

    console.log('✅ Tags API: Fetched', tags.length, 'tags');

    return NextResponse.json({
      success: true,
      tags,
    });
  } catch (error) {
    console.error('❌ Tags API Error:', error);
    console.error(
      '❌ Error details:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    console.error(
      '❌ Error stack:',
      error instanceof Error ? error.stack : 'No stack'
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch tags',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contacts/tags
 * Create a new tag
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
    const validatedData = createTagSchema.parse(body);

    const newTag = await createTag(user.id, validatedData);

    return NextResponse.json({
      success: true,
      tag: newTag,
    });
  } catch (error) {
    console.error('Error creating tag:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}
