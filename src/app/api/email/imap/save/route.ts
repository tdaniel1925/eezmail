/**
 * IMAP Account Save API
 * Saves IMAP account to database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, password, host, port, secure, provider, userId } = body;

    if (!email || !password || !host || !port || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify userId matches authenticated user
    if (userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('💾 Saving IMAP account:', {
      email,
      host,
      port,
      secure,
      provider,
      userId,
    });

    // Save IMAP account to database with full IMAP configuration
    const [inserted] = await db
      .insert(emailAccounts)
      .values({
        userId: user.id,
        provider: provider || 'imap',
        authType: 'imap',
        emailAddress: email,
        displayName: email.split('@')[0],
        accessToken: password, // Store password as access token for IMAP
        status: 'active',
        // Store IMAP settings for sync service
        imapHost: host,
        imapPort: port,
        imapUsername: email,
        imapPassword: password,
        imapUseSsl: secure !== false, // Default to true
      } as any)
      .returning();

    console.log('✅ IMAP account saved successfully:', inserted);

    return NextResponse.json({
      success: true,
      accountId: inserted[0]?.id,
    });
  } catch (error) {
    console.error('❌ IMAP save error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
