/**
 * AI Sender Analysis API Endpoint
 * Determines sender importance and suggested screening action
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeSenderImportance } from '@/lib/openai/screening';

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

    // Get sender data from request
    const body = await request.json();
    const { senderEmail, senderName, previousEmails, userContext } = body;

    if (!senderEmail || !senderName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Analyze sender using AI
    const result = await analyzeSenderImportance(
      senderEmail,
      senderName,
      previousEmails || 0,
      userContext
    );

    return NextResponse.json({
      success: true,
      analysis: result,
    });
  } catch (error) {
    console.error('Sender analysis API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze sender' },
      { status: 500 }
    );
  }
}
