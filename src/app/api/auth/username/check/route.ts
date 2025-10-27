import { NextRequest, NextResponse } from 'next/server';
import { isUsernameAvailable } from '@/lib/auth/username-service';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/username/check
 * Check if a username is available
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

    const result = await isUsernameAvailable(username);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking username availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
