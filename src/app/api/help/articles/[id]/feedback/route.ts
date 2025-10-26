import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { knowledgeBaseArticles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { helpful, feedbackText } = body;

    // Update helpful counts
    if (helpful) {
      await db
        .update(knowledgeBaseArticles)
        .set({
          helpfulCount: sql`${knowledgeBaseArticles.helpfulCount} + 1`,
        })
        .where(eq(knowledgeBaseArticles.id, id));
    } else {
      await db
        .update(knowledgeBaseArticles)
        .set({
          notHelpfulCount: sql`${knowledgeBaseArticles.notHelpfulCount} + 1`,
        })
        .where(eq(knowledgeBaseArticles.id, id));
    }

    // Store feedback in kb_article_feedback table if feedbackText is provided
    if (feedbackText) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Note: kb_article_feedback table creation is in migration 016
      // This would insert the feedback, but for now we'll just log it
      console.log('Feedback received:', {
        articleId: id,
        userId: user?.id || null,
        helpful,
        feedbackText,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Submit feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
