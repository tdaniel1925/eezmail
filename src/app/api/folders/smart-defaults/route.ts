import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applySmartDefaults } from '@/lib/folders/smart-defaults';

/**
 * POST /api/folders/smart-defaults
 * Applies smart folder defaults to an account
 * Body: { accountId, userId }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accountId, userId } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Ensure user can only apply defaults to their own accounts
    if (userId && userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await applySmartDefaults(accountId, user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to apply smart defaults' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      foldersEnabled: result.foldersEnabled,
      message: 'Smart defaults applied successfully',
    });
  } catch (error) {
    console.error('Error applying smart defaults:', error);
    return NextResponse.json(
      { error: 'Failed to apply smart defaults' },
      { status: 500 }
    );
  }
}
