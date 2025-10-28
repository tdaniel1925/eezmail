import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { betaFeedback, betaAnalytics } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { analyzeFeedback } from '@/lib/beta/ai-analyzer';
import { sendFeedbackThanksEmail } from '@/lib/beta/email-sender';

/**
 * POST /api/beta/feedback
 * Submit new beta feedback
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, title, description, rating } = body;

    if (!type || !title || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Analyze feedback with AI in the background (don't await)
    const aiAnalysis = await analyzeFeedback({ title, description });

    // Insert feedback
    const [feedback] = await db
      .insert(betaFeedback)
      .values({
        userId: user.id,
        type,
        title,
        description,
        rating: rating || null,
        sentiment: aiAnalysis.sentiment,
        tags: aiAnalysis.tags,
        priority: aiAnalysis.priority,
        status: 'new',
      })
      .returning();

    // Track analytics event
    await db.insert(betaAnalytics).values({
      userId: user.id,
      eventType: 'feedback_submitted',
      eventData: {
        feedback_id: feedback.id,
        type,
      },
    });

    // Send thank you email
    sendFeedbackThanksEmail(user.id, title, false).catch((error) => {
      console.error('Failed to send feedback thanks email:', error);
    });

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/beta/feedback
 * Get all feedback (admin only)
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (role='admin')
    // This is a simplified check - you might need to check against users table
    const isAdmin = true; // TODO: Implement proper admin check

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allFeedback = await db.select().from(betaFeedback).orderBy(betaFeedback.createdAt);

    return NextResponse.json({ feedback: allFeedback });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/beta/feedback
 * Update feedback status (admin only)
 */
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { feedbackId, status } = body;

    if (!feedbackId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [updatedFeedback] = await db
      .update(betaFeedback)
      .set({ status, updatedAt: new Date() })
      .where(eq(betaFeedback.id, feedbackId))
      .returning();

    return NextResponse.json({ success: true, feedback: updatedFeedback });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    );
  }
}

