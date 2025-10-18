import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for AI screener request
const screenerSchema = z.object({
  emailId: z.string().optional(),
  from: z.string().email('Invalid sender email'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        size: z.number(),
      })
    )
    .optional()
    .default([]),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = screenerSchema.parse(body);

    // TODO: Implement actual AI screener logic
    // For now, return mock screening results
    const mockScreening = {
      priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
      category: 'general' as
        | 'newsletter'
        | 'promotion'
        | 'important'
        | 'spam'
        | 'general',
      sentiment: 'neutral' as 'positive' | 'negative' | 'neutral',
      isSpam: false,
      confidence: 0.85,
      suggestedActions: ['Mark as important', 'Add to follow-up', 'Archive'],
      keyPoints: [
        'Email contains important information',
        'Requires response within 24 hours',
        'Contains actionable items',
      ],
    };

    console.log('AI Screener request:', {
      emailId: validatedData.emailId,
      from: validatedData.from,
      subject: validatedData.subject.substring(0, 50) + '...',
      bodyLength: validatedData.body.length,
      attachmentCount: validatedData.attachments.length,
    });

    return NextResponse.json({
      success: true,
      screening: mockScreening,
    });
  } catch (error) {
    console.error('Error screening email:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to screen email' },
      { status: 500 }
    );
  }
}
