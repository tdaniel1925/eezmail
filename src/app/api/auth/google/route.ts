/**
 * Google Gmail OAuth Initiation
 * Redirects user to Google OAuth consent screen
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GmailService } from '@/lib/email/gmail-api';

export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log('🚀 INITIATING GOOGLE GMAIL OAUTH');

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Initialize Gmail service
    const gmailConfig = {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`,
    };

    const gmail = new GmailService(gmailConfig);

    // Generate state with user ID
    const state = JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
    });

    const authUrl = gmail.generateAuthUrl(state);
    console.log('✅ Redirecting to Gmail OAuth URL');

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('❌ Gmail OAuth initiation error:', error);
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings?error=${encodeURIComponent(
          error instanceof Error ? error.message : 'Unknown error'
        )}`,
        request.url
      )
    );
  }
}

