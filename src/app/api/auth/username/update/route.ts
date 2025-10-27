import { NextRequest, NextResponse } from 'next/server';
import { updateUsername } from '@/lib/auth/username-service';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/username/update
 * Update the current user's username
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { username } = body;

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const result = await updateUsername(user.id, username);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update username' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, username });
  } catch (error) {
    console.error('Error updating username:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
