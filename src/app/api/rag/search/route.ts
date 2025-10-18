import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { searchEmails, findSimilarEmails, searchEmailsFromSender } from '@/lib/rag/search';
import { z } from 'zod';

// Validation schema
const searchSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  limit: z.number().min(1).max(50).optional().default(10),
  threshold: z.number().min(0).max(1).optional().default(0.7),
  senderEmail: z.string().email().optional(),
  similarTo: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await req.json();
    const validatedData = searchSchema.parse(body);

    let result;

    // Different search modes
    if (validatedData.similarTo) {
      // Find emails similar to a specific email
      result = await findSimilarEmails(
        validatedData.similarTo,
        user.id,
        validatedData.limit
      );
    } else if (validatedData.senderEmail) {
      // Search emails from specific sender
      result = await searchEmailsFromSender(
        validatedData.query,
        validatedData.senderEmail,
        user.id,
        validatedData.limit
      );
    } else {
      // Standard semantic search
      result = await searchEmails(validatedData.query, user.id, {
        limit: validatedData.limit,
        threshold: validatedData.threshold,
      });
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Search failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      results: result.results,
      count: result.results.length,
      query: validatedData.query,
    });

  } catch (error) {
    console.error('Error in RAG search API:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

