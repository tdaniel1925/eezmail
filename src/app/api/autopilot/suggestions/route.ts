/**
 * Autopilot Rules API
 * Manage autopilot rules and get suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeAndSuggestRules } from '@/lib/ai/autopilot-learning';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get rule suggestions based on learned patterns
    const suggestions = await analyzeAndSuggestRules(user.id);

    return NextResponse.json({
      success: true,
      suggestions,
      count: suggestions.length,
    });
  } catch (error) {
    console.error('Error getting rule suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to get rule suggestions' },
      { status: 500 }
    );
  }
}
