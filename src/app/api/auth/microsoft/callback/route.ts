import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAccounts, users } from '@/db/schema';
import { MicrosoftGraphService } from '@/lib/email/microsoft-graph';
import { triggerSync } from '@/lib/sync/sync-orchestrator';

export async function GET(request: NextRequest) {
  console.log('🚀 MICROSOFT EMAIL CALLBACK TRIGGERED');

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const stateParam = searchParams.get('state');

  if (error) {
    console.error('❌ OAuth error:', error);
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings?tab=email-accounts&error=${error}`,
        request.url
      )
    );
  }

  if (!code) {
    console.error('❌ No authorization code');
    return NextResponse.redirect(
      new URL(
        '/dashboard/settings?tab=email-accounts&error=no_code',
        request.url
      )
    );
  }

  try {
    // Parse state to get user ID
    const state = stateParam ? JSON.parse(stateParam) : null;
    const userIdFromState = state?.userId;

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('❌ No authenticated user');
      return NextResponse.redirect(
        new URL(
          '/dashboard/settings?tab=email-accounts&error=unauthorized',
          request.url
        )
      );
    }

    // Verify state matches (security check)
    if (userIdFromState && userIdFromState !== user.id) {
      console.error('❌ State mismatch - possible CSRF attack');
      return NextResponse.redirect(
        new URL(
          '/dashboard/settings?tab=email-accounts&error=state_mismatch',
          request.url
        )
      );
    }

    console.log('✅ User authenticated:', user.id);
    console.log('🔄 Exchanging code for tokens...');

    // Initialize Microsoft Graph service
    const msGraphConfig = {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/microsoft/callback`,
    };

    const msGraph = new MicrosoftGraphService(msGraphConfig);

    // Exchange code for tokens
    const tokens = await msGraph.exchangeCodeForToken(code);

    console.log('✅ Tokens received');
    console.log('🔄 Fetching user profile...');

    // Get user profile from Microsoft Graph
    const profile = await msGraph.getUserProfile(tokens.accessToken);
    const email = profile.email;

    console.log('✅ User profile received:', email);

    // Ensure user exists in users table
    await db
      .insert(users)
      .values({
        id: user.id,
        email: user.email || email,
        fullName:
          user.user_metadata?.full_name ||
          profile.displayName ||
          email.split('@')[0],
      })
      .onConflictDoNothing();

    console.log('✅ User record ensured');
    console.log('💾 Saving email account to database...');

    // Save email account to database
    const inserted = await db
      .insert(emailAccounts)
      .values({
        userId: user.id,
        provider: 'microsoft',
        authType: 'oauth',
        emailAddress: email,
        displayName: profile.displayName || email.split('@')[0],
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        status: 'syncing', // Set to syncing (Inngest will update to active)
        initialSyncCompleted: false, // Mark as not complete yet
      } as any)
      .returning();

    console.log('✅ Email account saved successfully!', inserted[0]?.id);
    console.log('📧 Email:', email);

    // Trigger sync via orchestrator
    console.log('🔄 Triggering sync via orchestrator...');
    const syncResult = await triggerSync({
      accountId: inserted[0].id,
      userId: user.id,
      trigger: 'oauth',
    });

    if (syncResult.success) {
      console.log('✅ Sync triggered successfully!');
      console.log(`   Run ID: ${syncResult.runId}`);
    } else {
      console.error('❌ Failed to trigger sync:', syncResult.error);
    }

    // Redirect to inbox with syncing status
    return NextResponse.redirect(
      new URL(
        `/dashboard/inbox?syncing=${inserted[0].id}&email=${encodeURIComponent(email)}`,
        request.url
      )
    );
  } catch (error) {
    console.error('❌ Microsoft callback error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to connect';
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings?tab=email-accounts&error=${encodeURIComponent(errorMessage)}`,
        request.url
      )
    );
  }
}
