/**
 * Google Gmail OAuth Initiation
 * Redirects user to Google OAuth consent screen with incremental authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GmailService, GmailScopeLevel } from '@/lib/email/gmail-api';

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

    // Check if requesting additional scopes (incremental auth)
    const searchParams = request.nextUrl.searchParams;
    const additionalScopes = searchParams.get('scopes');
    
    // Default: base + read scopes for initial connection
    let scopeLevels: GmailScopeLevel[] = ['base', 'read'];
    
    // Parse additional scopes if provided (for incremental auth)
    if (additionalScopes) {
      const requested = additionalScopes.split(',') as GmailScopeLevel[];
      scopeLevels = [...scopeLevels, ...requested];
      console.log('🔐 Requesting additional Gmail scopes:', requested);
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

    // Generate auth URL with incremental authorization enabled
    const authUrl = gmail.generateAuthUrl(state, scopeLevels);
    console.log('✅ Redirecting to Gmail OAuth URL with scopes:', scopeLevels);

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

