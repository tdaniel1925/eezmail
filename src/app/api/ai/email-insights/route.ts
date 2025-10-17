import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Aggregated email insights API
 * Combines multiple AI endpoints for comprehensive email analysis
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emailId } = await req.json();

    if (!emailId) {
      return NextResponse.json(
        { error: 'Email ID is required' },
        { status: 400 }
      );
    }

    // Fetch email from database
    const [email] = await db
      .select()
      .from(emails)
      .where(eq(emails.id, emailId))
      .limit(1);

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Parallel fetch all insights
    const [summaryRes, actionsRes, sentimentRes, meetingRes] =
      await Promise.allSettled([
        fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/summarize`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailId }),
          }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/extract-actions`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailId }),
          }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/analyze-sentiment`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailId }),
          }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/detect-meeting`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailId }),
          }
        ),
      ]);

    // Process results
    const insights: any = {};

    if (summaryRes.status === 'fulfilled' && summaryRes.value.ok) {
      const data = await summaryRes.value.json();
      insights.summary = data.summary;
    }

    if (actionsRes.status === 'fulfilled' && actionsRes.value.ok) {
      const data = await actionsRes.value.json();
      insights.actionItems = data.actions;
    }

    if (sentimentRes.status === 'fulfilled' && sentimentRes.value.ok) {
      const data = await sentimentRes.value.json();
      insights.sentiment = data.sentiment;
    }

    if (meetingRes.status === 'fulfilled' && meetingRes.value.ok) {
      const data = await meetingRes.value.json();
      insights.meeting = data.meeting;
    }

    // Add thread count (simplified - can be enhanced)
    insights.threadCount = 1;

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Email insights error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email insights' },
      { status: 500 }
    );
  }
}
