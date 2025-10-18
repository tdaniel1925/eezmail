import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeRelationship } from '@/lib/rag/relationships';
import { z } from 'zod';

const relationshipSchema = z.object({
  contactEmail: z.string().email('Valid email required'),
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await req.json();
    const { contactEmail } = relationshipSchema.parse(body);

    // Analyze relationship
    const result = await analyzeRelationship(contactEmail, user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Analysis failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      insights: result.insights,
    });
  } catch (error) {
    console.error('Error in relationship API:', error);

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

