import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username || username.length < 3) {
      return NextResponse.json(
        { available: false, error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Check if username exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase()))
      .limit(1);

    const available = existingUser.length === 0;

    // Generate suggestions if taken
    const suggestions: string[] = [];
    if (!available) {
      const baseUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
      suggestions.push(`${baseUsername}${Math.floor(Math.random() * 100)}`);
      suggestions.push(`${baseUsername}_${Math.floor(Math.random() * 1000)}`);
      suggestions.push(`${baseUsername}${new Date().getFullYear()}`);
    }

    return NextResponse.json({
      available,
      username,
      suggestions,
    });
  } catch (error) {
    console.error('[USERNAME_CHECK] Error:', error);
    return NextResponse.json(
      { available: false, error: 'Failed to check username availability' },
      { status: 500 }
    );
  }
}

