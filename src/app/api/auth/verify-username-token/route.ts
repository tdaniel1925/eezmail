import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';

/**
 * POST /api/auth/verify-username-token
 * Verify a username change token
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Find user with valid token
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.usernameChangeToken, token),
        gt(users.usernameChangeTokenExpiry, new Date())
      ),
      columns: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      currentUsername: user.username,
    });
  } catch (error) {
    console.error('[Verify Username Token] Error:', error);
    return NextResponse.json(
      { error: 'Failed to verify token' },
      { status: 500 }
    );
  }
}
