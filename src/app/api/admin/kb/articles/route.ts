import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { knowledgeBaseArticles } from '@/db/schema';
import { desc, like, or, eq } from 'drizzle-orm';
import { logAuditAction } from '@/lib/audit/logger';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const categoryId = searchParams.get('categoryId');

    let query = db.select().from(knowledgeBaseArticles);

    if (search) {
      query = query.where(
        or(
          like(knowledgeBaseArticles.title, `%${search}%`),
          like(knowledgeBaseArticles.content, `%${search}%`)
        )
      ) as any;
    }

    if (status) {
      query = query.where(eq(knowledgeBaseArticles.status, status)) as any;
    }

    if (categoryId) {
      query = query.where(
        eq(knowledgeBaseArticles.categoryId, categoryId)
      ) as any;
    }

    const articles = await query.orderBy(desc(knowledgeBaseArticles.createdAt));

    return NextResponse.json(articles);
  } catch (error) {
    console.error('Get articles error:', error);
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

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const [newArticle] = await db
      .insert(knowledgeBaseArticles)
      .values({
        title: body.title,
        slug: body.slug,
        content: body.content,
        excerpt: body.excerpt || null,
        categoryId: body.categoryId || null,
        tags: body.tags || [],
        authorId: body.authorId,
        status: body.status || 'draft',
        visibility: body.visibility || 'public',
        featured: body.featured || false,
        seoTitle: body.seoTitle || null,
        seoDescription: body.seoDescription || null,
        seoKeywords: body.seoKeywords || null,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
      })
      .returning();

    // Log to audit
    await logAuditAction({
      actorId: user.id,
      actorType: 'user',
      actorEmail: user.email!,
      action: 'kb_article.created',
      resourceType: 'kb_article',
      resourceId: newArticle.id,
      metadata: {
        title: newArticle.title,
        status: newArticle.status,
      },
      riskLevel: 'low',
    });

    return NextResponse.json(newArticle);
  } catch (error: any) {
    console.error('Create article error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create article' },
      { status: 500 }
    );
  }
}
