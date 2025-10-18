import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for AI summary request
const summarySchema = z.object({
  emailId: z.string().optional(),
  text: z.string().min(1, 'Text to summarize is required'),
  type: z.enum(['email', 'thread', 'attachment']).optional().default('email'),
  maxLength: z.number().min(50).max(500).optional().default(200),
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
    const validatedData = summarySchema.parse(body);

    // TODO: Implement actual AI summary generation
    // For now, return a mock summary
    const mockSummary = `This email appears to be about ${validatedData.type === 'email' ? 'email communication' : validatedData.type === 'thread' ? 'email thread discussion' : 'document content'}. The content contains important information that requires attention. Key points include relevant details and actionable items.`;

    console.log('AI Summary request:', {
      emailId: validatedData.emailId,
      type: validatedData.type,
      textLength: validatedData.text.length,
      maxLength: validatedData.maxLength,
    });

    return NextResponse.json({
      success: true,
      summary: mockSummary,
      type: validatedData.type,
      originalLength: validatedData.text.length,
      summaryLength: mockSummary.length,
    });
  } catch (error) {
    console.error('Error generating AI summary:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
