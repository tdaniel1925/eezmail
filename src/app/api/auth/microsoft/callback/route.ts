import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAccounts, users } from '@/db/schema';
import { MicrosoftGraphService } from '@/lib/email/microsoft-graph';
import { applySmartDefaults } from '@/lib/folders/smart-defaults';
import { cleanupOrphanedFolders } from '@/lib/folders/cleanup';
import { eq, sql } from 'drizzle-orm';

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

    // Clean up any orphaned folders before proceeding
    await cleanupOrphanedFolders(user.id);

    // Count user's total email accounts (including the one just added)
    const accountCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailAccounts)
      .where(eq(emailAccounts.userId, user.id));

    const totalAccounts = Number(accountCountResult[0]?.count || 1);
    console.log(`📊 User has ${totalAccounts} total accounts`);

    // Tiered folder selection based on account count
    if (totalAccounts === 1) {
      // First account - mandatory folder selection with "Use Recommended" option
      console.log(
        '👤 First account - redirecting to folder selection (required)'
      );
      return NextResponse.redirect(
        new URL(
          `/dashboard/onboarding/folders?accountId=${inserted[0].id}&required=true`,
          request.url
        )
      );
    } else if (totalAccounts <= 3) {
      // 2nd-3rd account - optional folder selection with smart defaults
      console.log(
        '👥 Additional account (2-3) - redirecting to folder selection (optional)'
      );
      return NextResponse.redirect(
        new URL(
          `/dashboard/onboarding/folders?accountId=${inserted[0].id}&optional=true`,
          request.url
        )
      );
    } else {
      // 4+ accounts - auto-apply smart defaults and skip UI
      console.log('👨‍👩‍👧‍👦 Power user (4+) - applying smart defaults');
      await applySmartDefaults(inserted[0].id, user.id);

      return NextResponse.redirect(
        new URL(
          `/dashboard/inbox?newAccount=${inserted[0].id}&email=${encodeURIComponent(email)}`,
          request.url
        )
      );
    }
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
