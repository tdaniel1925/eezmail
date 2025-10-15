/**
 * Google Gmail OAuth Callback
 * Handles Google Gmail OAuth flow completion
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAccounts, users } from '@/db/schema';
import { GmailService } from '@/lib/email/gmail-api';

export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log('🚀 GOOGLE GMAIL CALLBACK TRIGGERED');
  console.log('🔗 Full URL:', request.url);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        new URL('/login?error=unauthorized', request.url)
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('📋 Google Gmail callback parameters:', {
      hasCode: !!code,
      hasState: !!state,
      hasError: !!error,
      codeLength: code?.length || 0,
    });

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/settings?error=${encodeURIComponent(error)}`,
          request.url
        )
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=missing_parameters', request.url)
      );
    }

    // Parse state
    let stateData;
    try {
      stateData = JSON.parse(state);
    } catch {
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=invalid_state', request.url)
      );
    }

    // Verify userId matches
    if (stateData.userId !== user.id) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=unauthorized', request.url)
      );
    }

    console.log('🔄 Step 1: Exchanging code for Gmail token...');

    // Initialize Gmail service
    const gmailConfig = {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`,
    };

    const gmail = new GmailService(gmailConfig);
    const tokenResponse = await gmail.exchangeCodeForToken(code);
    console.log('✅ Gmail token received');

    // Get user profile
    console.log('🔄 Step 2: Getting user profile from Gmail...');
    const userProfile = await gmail.getUserProfile(tokenResponse.accessToken);
    console.log('✅ User profile received:', userProfile.email);

    // Ensure user exists in database
    console.log('🔄 Step 3: Ensuring user exists in database...');
    await db
      .insert(users)
      .values({
        id: user.id,
        email: user.email!,
        fullName: (user as any).user_metadata?.full_name || '',
        avatarUrl: (user as any).user_metadata?.avatar_url || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email!,
          updatedAt: new Date(),
        },
      });
    console.log('✅ User record ensured');

    // Save email account
    console.log('🔄 Step 4: Saving Gmail account...');
    try {
      const tokenExpiresAt = new Date(
        Date.now() + (tokenResponse.expiresIn || 3600) * 1000
      );
      const [inserted] = await db
        .insert(emailAccounts)
        .values({
          userId: user.id,
          provider: 'gmail',
          authType: 'oauth',
          emailAddress: userProfile.email,
          displayName: userProfile.displayName,
          accessToken: tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken,
          tokenExpiresAt,
          status: 'active',
        })
        .returning();

      console.log('✅ Gmail account saved successfully!', inserted);
      console.log('📧 Account ID:', inserted?.id);
      console.log('👤 User ID:', user.id);

      // Redirect to settings with success message
      return NextResponse.redirect(
        new URL(
          `/dashboard/settings?tab=email-accounts&success=true&email=${encodeURIComponent(userProfile.email)}`,
          request.url
        )
      );
    } catch (dbError) {
      console.error('❌ Database insert failed:', dbError);
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=database_error', request.url)
      );
    }
  } catch (error) {
    console.error('❌ Gmail callback error:', error);
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
