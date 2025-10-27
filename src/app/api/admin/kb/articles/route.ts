import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin/auth';
import { db } from '@/db';
import { knowledgeBaseArticles, knowledgeBaseCategories } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
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

    // Get articles with category info
    const articles = await db
      .select({
        article: knowledgeBaseArticles,
        category: knowledgeBaseCategories,
      })
      .from(knowledgeBaseArticles)
      .leftJoin(
        knowledgeBaseCategories,
        eq(knowledgeBaseArticles.categoryId, knowledgeBaseCategories.id)
      )
      .orderBy(desc(knowledgeBaseArticles.createdAt))
      .limit(100);

    // Get statistics
    const stats = {
      total: articles.length,
      published: articles.filter((a) => a.article.status === 'published')
        .length,
      draft: articles.filter((a) => a.article.status === 'draft').length,
      views: articles.reduce((sum, a) => sum + (a.article.views || 0), 0),
    };

    return NextResponse.json({ articles, stats });
  } catch (error) {
    console.error('[KB Articles API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
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

    const validatedData = articleSchema.parse(body);

    const [newArticle] = await db
      .insert(knowledgeBaseArticles)
      .values({
        ...validatedData,
        categoryId: validatedData.categoryId || null,
        publishedAt: validatedData.publishedAt
          ? new Date(validatedData.publishedAt)
          : null,
      })
      .returning();

    return NextResponse.json(newArticle, { status: 201 });
  } catch (error) {
    console.error('[KB Articles POST] Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    );
  }
}
