import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateProactiveSuggestions,
  getActionableSuggestions,
  getSuggestionsByType,
} from '@/lib/ai/proactive-suggestions';

/**
 * Proactive Suggestions API
 * Returns smart suggestions based on user patterns
 */
export async function GET(req: NextRequest): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const actionableOnly = searchParams.get('actionable') === 'true';

    console.log(`🔮 [Suggestions API] Request for user: ${user.id}`);

    let suggestions;

    if (type) {
      suggestions = await getSuggestionsByType(
        user.id,
        type as any
      );
    } else if (actionableOnly) {
      suggestions = await getActionableSuggestions(user.id);
    } else {
      suggestions = await generateProactiveSuggestions(user.id);
    }

    return NextResponse.json({
      success: true,
      suggestions,
      count: suggestions.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [Suggestions API Error]:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

