import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { isAdmin } from '@/lib/admin/auth';

/**
 * POST /api/auth/lookup-username
 * Look up username by email address
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Look up user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
      columns: {
        username: true,
      },
    });

    if (!user || !user.username) {
      return NextResponse.json(
        { error: 'No account found with that email address' },
        { status: 404 }
      );
    }

    console.log('[USERNAME LOOKUP] Found username for email:', email);

    return NextResponse.json({
      success: true,
      username: user.username,
    });
  } catch (error) {
    console.error('[USERNAME LOOKUP] Error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup username' },
      { status: 500 }
    );
  }
}
