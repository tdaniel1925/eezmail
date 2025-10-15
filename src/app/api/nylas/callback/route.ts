/**
 * Nylas OAuth Callback Endpoint
 * Exchanges authorization code for access token and stores account
 */

import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/nylas/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';

export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log('🚀 NYLAS CALLBACK TRIGGERED');
  console.log('🔗 Full URL:', request.url);
  console.log('🔍 Callback endpoint reached successfully!');

  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        new URL('/login?error=unauthorized', request.url)
      );
    }

    // Get authorization code and state
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('📋 Callback parameters:', {
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
        new URL('/dashboard/settings?error=missing_params', request.url)
      );
    }

    // Parse state to get provider and userId
    let stateData;
    try {
      stateData = JSON.parse(state);
    } catch (e) {
      console.error('Failed to parse state:', e);
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

    // Exchange code for token using Nylas hosted redirect URI
    const nylasRedirectUri = 'https://api.us.nylas.com/v3/connect/callback';

    console.log('🔄 Step 1: Exchanging code for token...');
    console.log('Redirect URI:', nylasRedirectUri);
    console.log('Code received:', code.substring(0, 10) + '...');
    console.log('Full code length:', code.length);

    const tokenResponse = await exchangeCodeForToken(code, nylasRedirectUri);
    console.log('✅ Token response received');

    // Nylas v3 returns a grant ID, not an access token
    const grantId = tokenResponse.grantId;

    if (!grantId) {
      console.error('❌ No grant ID in token response:', tokenResponse);
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=no_grant_id', request.url)
      );
    }

    console.log('✅ Grant ID received:', grantId);

    // Extract account information from token response
    const email = tokenResponse.email;
    const nylasProvider = tokenResponse.provider;

    if (!email) {
      console.error('❌ No email in token response:', tokenResponse);
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=no_email', request.url)
      );
    }

    console.log('✅ Email received:', email);
    console.log('✅ Provider received:', nylasProvider);

    // Determine provider from state (fallback to Nylas provider)
    const provider = stateData.provider || nylasProvider || 'gmail';

    console.log('🔄 Step 2: Ensuring user exists in database...');

    // First, ensure the user exists in our users table (upsert)
    const { users } = await import('@/db/schema');
    await db
      .insert(users)
      .values({
        id: user.id,
        email: user.email || email,
        fullName: user.user_metadata?.full_name || email.split('@')[0],
      })
      .onConflictDoNothing(); // Skip if user already exists

    console.log('✅ User record ensured');

    console.log('🔄 Step 3: Saving email account...');
    console.log('Account data:', {
      userId: user.id,
      provider,
      emailAddress: email,
      grantId,
    });

    // Store email account in database (only use basic columns to avoid schema issues)
    try {
      const inserted = await db
        .insert(emailAccounts)
        .values({
          userId: user.id,
          provider: provider,
          authType: 'oauth',
          emailAddress: email,
          displayName: email.split('@')[0], // Use email username as display name
          nylasGrantId: grantId,
          accessToken: grantId, // Store grant ID as access token for now
          status: 'active',
        })
        .returning();

      console.log('✅ Account saved successfully!', inserted);
      console.log('📧 Account ID:', inserted[0]?.id);
      console.log('👤 User ID:', user.id);
    } catch (dbError) {
      console.error('❌ Database insert failed:', dbError);
      console.error('❌ Database error details:', {
        message: dbError.message,
        code: dbError.code,
        constraint: dbError.constraint,
        detail: dbError.detail,
      });
      throw dbError;
    }

    // Redirect to settings with success message
    const response = NextResponse.redirect(
      new URL(
        `/dashboard/settings?tab=email-accounts&success=true&email=${encodeURIComponent(email)}`,
        request.url
      )
    );

    // Clear OAuth state cookie
    response.cookies.delete('nylas_oauth_state');

    return response;
  } catch (error) {
    console.error('❌ Nylas callback error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    const errorMessage =
      error instanceof Error ? error.message : 'connection_failed';
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings?error=${encodeURIComponent(errorMessage)}`,
        request.url
      )
    );
  }
}
