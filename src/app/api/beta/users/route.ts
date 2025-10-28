import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAllBetaUsers } from '@/lib/beta/user-service';

/**
 * GET /api/beta/users
 * Get all beta users (admin only)
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add proper admin check

    const users = await getAllBetaUsers();

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching beta users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

