import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin/auth';
import { db } from '@/db';
import { knowledgeBaseCategories } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().default(0),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all categories
    const categories = await db
      .select()
      .from(knowledgeBaseCategories)
      .orderBy(asc(knowledgeBaseCategories.sortOrder));

    return NextResponse.json(categories);
  } catch (error) {
    console.error('[KB Categories API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = categorySchema.parse(body);

    const [newCategory] = await db
      .insert(knowledgeBaseCategories)
      .values(validatedData)
      .returning();

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('[KB Categories POST] Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
