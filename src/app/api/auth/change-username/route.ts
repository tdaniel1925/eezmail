import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and, gt, ne } from 'drizzle-orm';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/change-username
 * Change username using a valid token
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { token, newUsername } = body;

    if (!token || !newUsername) {
      return NextResponse.json(
        { error: 'Token and new username are required' },
        { status: 400 }
      );
    }

    // Validate username format
    const usernameRegex = /^[a-z0-9_]{3,30}$/;
    if (!usernameRegex.test(newUsername)) {
      return NextResponse.json(
        {
          error:
            'Username must be 3-30 characters (lowercase, numbers, underscores only)',
        },
        { status: 400 }
      );
    }

    // Find user with valid token
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.usernameChangeToken, token),
        gt(users.usernameChangeTokenExpiry, new Date())
      ),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 404 }
      );
    }

    // Check if new username is already taken
    const existingUser = await db.query.users.findFirst({
      where: and(
        eq(users.username, newUsername.toLowerCase()),
        ne(users.id, user.id)
      ),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: `Username "${newUsername}" is already taken` },
        { status: 409 }
      );
    }

    // Update username and clear token
    await db
      .update(users)
      .set({
        username: newUsername.toLowerCase(),
        usernameChangeToken: null,
        usernameChangeTokenExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Also update in Supabase Auth metadata
    const adminClient = createAdminClient();
    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        username: newUsername.toLowerCase(),
      },
    });

    console.log('[Change Username] Username changed:', {
      userId: user.id,
      oldUsername: user.username,
      newUsername: newUsername.toLowerCase(),
    });

    return NextResponse.json({
      success: true,
      message: 'Username changed successfully',
      newUsername: newUsername.toLowerCase(),
    });
  } catch (error) {
    console.error('[Change Username] Error:', error);
    return NextResponse.json(
      { error: 'Failed to change username' },
      { status: 500 }
    );
  }
}
