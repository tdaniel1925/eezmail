/**
 * AI Email Screening API Endpoint
 * Used by the frontend to get AI analysis for emails
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { screenEmail } from '@/lib/openai/screening';

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
    const { from, fromName, subject, bodyText } = body;

    if (!from || !subject || !bodyText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Screen the email using AI
    const result = await screenEmail({
      from,
      fromName,
      subject,
      body: bodyText,
    });

    return NextResponse.json({
      success: true,
      screening: result,
    });
  } catch (error) {
    console.error('AI screening API error:', error);
    return NextResponse.json(
      { error: 'Failed to screen email' },
      { status: 500 }
    );
  }
}
