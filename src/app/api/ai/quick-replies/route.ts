import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { getUserSignatureData } from '@/lib/email/signature-formatter';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Get user signature data
    const signatureData = await getUserSignatureData(user.id);

    // Generate AI quick replies with professional formatting
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an email reply assistant. Generate ${validatedData.maxReplies} quick, professional reply options.

**FORMATTING RULES:**
Each reply should follow this structure:
Hi [Name],\\n\\n[Reply text 1-2 sentences]\\n\\nBest regards,\\n\\n${signatureData.name}\\n${signatureData.email}

Tone: ${validatedData.tone}

Return as JSON:
{
  "replies": ["reply1", "reply2", "reply3"]
}`,
        },
        {
          role: 'user',
          content: `Generate ${validatedData.maxReplies} quick reply options for this email context:\n\n${validatedData.context}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 400,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    const replies = (result.replies || []).map((reply: string) =>
      reply.replace(/\\n/g, '\n')
    );

    console.log('AI Quick Replies generated:', {
      emailId: validatedData.emailId,
      context: validatedData.context.substring(0, 100) + '...',
      tone: validatedData.tone,
      maxReplies: validatedData.maxReplies,
      repliesCount: replies.length,
    });

    return NextResponse.json({
      success: true,
      replies: replies,
      tone: validatedData.tone,
      count: replies.length,
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
