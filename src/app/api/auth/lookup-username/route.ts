import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
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

    console.log('[USERNAME LOOKUP] Looking up email:', email);

    // Look up user by email (case-insensitive)
    const normalizedEmail = email.toLowerCase().trim();
    const user = await db.query.users.findFirst({
      where: sql`LOWER(${users.email}) = ${normalizedEmail}`,
      columns: {
        username: true,
        email: true,
      },
    });

    if (!user || !user.username) {
      console.log('[USERNAME LOOKUP] No user found for email:', email);

      // Try to find similar emails for debugging
      const allUsers = await db
        .select({
          email: users.email,
          username: users.username,
        })
        .from(users)
        .limit(10);

      console.log(
        '[USERNAME LOOKUP] Available users (first 10):',
        allUsers.map((u) => ({ email: u.email, username: u.username }))
      );

      return NextResponse.json(
        { error: 'No account found with that email address' },
        { status: 404 }
      );
    }

    console.log(
      '[USERNAME LOOKUP] Found username:',
      user.username,
      'for email:',
      user.email
    );

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
