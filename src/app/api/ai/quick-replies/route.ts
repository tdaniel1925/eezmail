import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for AI quick replies request
const quickRepliesSchema = z.object({
  emailId: z.string().optional(),
  context: z.string().min(1, 'Context is required'),
  tone: z
    .enum(['professional', 'casual', 'friendly', 'formal'])
    .optional()
    .default('professional'),
  maxReplies: z.number().min(1).max(5).optional().default(3),
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
    const validatedData = quickRepliesSchema.parse(body);

    // TODO: Implement actual AI quick replies generation
    // For now, return mock quick replies
    const mockReplies = [
      `Thank you for your email. I'll review this and get back to you soon.`,
      `I appreciate you reaching out. Let me look into this matter and respond accordingly.`,
      `Thanks for the information. I'll take this into consideration and follow up as needed.`,
    ].slice(0, validatedData.maxReplies);

    console.log('AI Quick Replies request:', {
      emailId: validatedData.emailId,
      context: validatedData.context.substring(0, 100) + '...',
      tone: validatedData.tone,
      maxReplies: validatedData.maxReplies,
    });

    return NextResponse.json({
      success: true,
      replies: mockReplies,
      tone: validatedData.tone,
      count: mockReplies.length,
    });
  } catch (error) {
    console.error('Error generating AI quick replies:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate quick replies' },
      { status: 500 }
    );
  }
}
