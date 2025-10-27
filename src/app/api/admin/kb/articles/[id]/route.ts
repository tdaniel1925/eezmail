import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin/auth';
import { db } from '@/db';
import { knowledgeBaseArticles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const articleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  authorId: z.string(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  visibility: z
    .enum(['public', 'internal', 'customers_only'])
    .default('public'),
  featured: z.boolean().default(false),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).optional(),
  publishedAt: z.string().optional(),
});

// GET single article
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const article = await db.query.knowledgeBaseArticles.findFirst({
      where: eq(knowledgeBaseArticles.id, id),
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error('[KB Article GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

// PATCH - Update article
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    const validatedData = articleSchema.parse(body);

    const [updatedArticle] = await db
      .update(knowledgeBaseArticles)
      .set({
        ...validatedData,
        categoryId: validatedData.categoryId || null,
        publishedAt: validatedData.publishedAt
          ? new Date(validatedData.publishedAt)
          : null,
        updatedAt: new Date(),
      })
      .where(eq(knowledgeBaseArticles.id, id))
      .returning();

    return NextResponse.json(updatedArticle);
  } catch (error) {
    console.error('[KB Article PATCH] Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

// DELETE article
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    await db
      .delete(knowledgeBaseArticles)
      .where(eq(knowledgeBaseArticles.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[KB Article DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    );
  }
}
