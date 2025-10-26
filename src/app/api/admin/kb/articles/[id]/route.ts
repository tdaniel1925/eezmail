import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { knowledgeBaseArticles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logAuditAction } from '@/lib/audit/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const article = await db.query.knowledgeBaseArticles.findFirst({
      where: eq(knowledgeBaseArticles.id, id),
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error('Get article error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

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

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const [updatedArticle] = await db
      .update(knowledgeBaseArticles)
      .set({
        ...body,
        updatedAt: new Date(),
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
      })
      .where(eq(knowledgeBaseArticles.id, id))
      .returning();

    if (!updatedArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Log to audit
    await logAuditAction({
      actorId: user.id,
      actorType: 'user',
      actorEmail: user.email!,
      action: 'kb_article.updated',
      resourceType: 'kb_article',
      resourceId: id,
      changes: body,
      metadata: {
        title: updatedArticle.title,
        status: updatedArticle.status,
      },
      riskLevel: 'low',
    });

    return NextResponse.json(updatedArticle);
  } catch (error: any) {
    console.error('Update article error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update article' },
      { status: 500 }
    );
  }
}

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

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Get article first for logging
    const article = await db.query.knowledgeBaseArticles.findFirst({
      where: eq(knowledgeBaseArticles.id, id),
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    await db
      .delete(knowledgeBaseArticles)
      .where(eq(knowledgeBaseArticles.id, id));

    // Log to audit
    await logAuditAction({
      actorId: user.id,
      actorType: 'user',
      actorEmail: user.email!,
      action: 'kb_article.deleted',
      resourceType: 'kb_article',
      resourceId: id,
      metadata: {
        title: article.title,
      },
      riskLevel: 'medium',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete article error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete article' },
      { status: 500 }
    );
  }
}
