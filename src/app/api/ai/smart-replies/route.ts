/**
 * AI Smart Replies API Endpoint
 * Generates quick reply suggestions for emails
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateSmartReplies } from '@/lib/openai/screening';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get email data from request
    const body = await request.json();
    const { from, subject, bodyText } = body;

    if (!from || !subject || !bodyText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate smart replies using AI
    const replies = await generateSmartReplies({
      from,
      subject,
      body: bodyText,
    });

    return NextResponse.json({
      success: true,
      replies,
    });
  } catch (error) {
    console.error('Smart replies API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate replies' },
      { status: 500 }
    );
  }
}
