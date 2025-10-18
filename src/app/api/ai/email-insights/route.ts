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

    // For now, return simplified insights based on email content
    // In production, this would call actual AI services
    const insights: any = {
      threadCount: 1,
    };

    // Generate basic summary from email content
    if (email.bodyText || email.bodyHtml) {
      const text = email.bodyText || email.bodyHtml || '';
      const preview = text.substring(0, 200);
      insights.summary =
        preview.length < text.length ? preview + '...' : preview;
    }

    // Simple sentiment analysis based on content
    const content = (email.bodyText || email.bodyHtml || '').toLowerCase();
    if (
      content.includes('urgent') ||
      content.includes('asap') ||
      content.includes('important')
    ) {
      insights.sentiment = 'urgent';
    } else if (content.includes('thanks') || content.includes('appreciate')) {
      insights.sentiment = 'positive';
    } else {
      insights.sentiment = 'neutral';
    }

    // Detect potential action items
    const actionKeywords = [
      'please',
      'could you',
      'can you',
      'would you',
      'need to',
      'should',
    ];
    const hasActionItems = actionKeywords.some((keyword) =>
      content.includes(keyword)
    );
    if (hasActionItems) {
      insights.actionItems = ['Review and respond to this email'];
    }

    // Simple meeting detection
    const meetingKeywords = [
      'meeting',
      'call',
      'zoom',
      'teams',
      'schedule',
      'calendar',
    ];
    const hasMeeting = meetingKeywords.some((keyword) =>
      content.includes(keyword)
    );
    if (hasMeeting) {
      insights.meeting = {
        detected: true,
      };
    }

    // Response expectation
    if (email.subject?.includes('?') || content.includes('?')) {
      insights.responseExpected = true;
      insights.estimatedResponseTime = 'within 24 hours';
    }

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Email insights error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email insights' },
      { status: 500 }
    );
  }
}
