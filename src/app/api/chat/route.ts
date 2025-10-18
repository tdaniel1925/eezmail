import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { buildContextForQuery } from '@/lib/rag/context';
import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validation schema for chat request
const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  context: z
    .object({
      emailId: z.string().optional(),
      threadId: z.string().optional(),
      folderId: z.string().optional(),
    })
    .optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
        timestamp: z.string().datetime(),
      })
    )
    .optional()
    .default([]),
  maxTokens: z.number().min(50).max(2000).optional().default(500),
  useRag: z.boolean().optional().default(true),
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
    const validatedData = chatSchema.parse(body);

    let systemPrompt = `You are an AI email assistant helping users manage their inbox efficiently. 
You can help with:
- Finding and summarizing emails
- Drafting responses
- Managing contacts
- Organizing inbox
- Providing insights about email patterns

Be helpful, concise, and professional.`;

    let contextInfo = '';

    // Build RAG context if enabled and query seems like a search
    if (validatedData.useRag && shouldUseRag(validatedData.message)) {
      const ragContext = await buildContextForQuery(
        validatedData.message,
        user.id,
        5
      );

      if (ragContext.totalFound > 0) {
        contextInfo = `\n\nRELEVANT EMAILS:\n${ragContext.summary}`;
        systemPrompt += `\n\nI have searched the user's emails and found relevant information. Use this context to provide accurate answers.`;
      }
    }

    // Get current email context if provided
    if (validatedData.context?.emailId) {
      try {
        const [currentEmail] = await db
          .select({
            subject: emails.subject,
            bodyText: emails.bodyText,
            fromAddress: emails.fromAddress,
          })
          .from(emails)
          .where(eq(emails.id, validatedData.context.emailId))
          .limit(1);

        if (currentEmail) {
          const from =
            typeof currentEmail.fromAddress === 'string'
              ? currentEmail.fromAddress
              : (currentEmail.fromAddress as any)?.name ||
                (currentEmail.fromAddress as any)?.email ||
                'Unknown';

          contextInfo += `\n\nCURRENT EMAIL:
From: ${from}
Subject: ${currentEmail.subject}
Body: ${(currentEmail.bodyText || '').substring(0, 500)}...`;
        }
      } catch (error) {
        console.error('Error fetching current email:', error);
      }
    }

    // Build messages for OpenAI
    const messages: any[] = [
      { role: 'system', content: systemPrompt + contextInfo },
      ...validatedData.history.map((h) => ({
        role: h.role,
        content: h.content,
      })),
      { role: 'user', content: validatedData.message },
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      max_tokens: validatedData.maxTokens,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

    console.log('AI Chat request:', {
      message: validatedData.message.substring(0, 100) + '...',
      context: validatedData.context,
      historyLength: validatedData.history.length,
      ragUsed: validatedData.useRag && contextInfo.length > 0,
      tokensUsed: completion.usage?.total_tokens,
    });

    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
      context: validatedData.context,
      ragUsed: contextInfo.length > 0,
    });
  } catch (error) {
    console.error('Error processing chat request:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

/**
 * Determine if RAG should be used based on query
 */
function shouldUseRag(message: string): boolean {
  const ragKeywords = [
    'find',
    'search',
    'show',
    'tell me about',
    'what did',
    'when did',
    'who sent',
    'emails from',
    'emails about',
    'previous',
    'history',
    'past',
    'recent',
    'last',
  ];

  const lowerMessage = message.toLowerCase();
  return ragKeywords.some((keyword) => lowerMessage.includes(keyword));
}
