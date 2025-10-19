/**
 * Microsoft Graph OAuth Callback
 * Handles Microsoft Graph OAuth flow completion
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { MicrosoftGraphService } from '@/lib/email/microsoft-graph';
import { subscribeToWebhook } from '@/lib/webhooks/webhook-actions';

export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log('🚀 MICROSOFT GRAPH CALLBACK TRIGGERED');
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

    console.log('📋 Microsoft Graph callback parameters:', {
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

    console.log('🔄 Step 1: Exchanging code for Microsoft Graph token...');

    // Initialize Microsoft Graph service
    const msGraphConfig = {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/microsoft/callback`,
    };

    const msGraph = new MicrosoftGraphService(msGraphConfig);
    const tokenResponse = await msGraph.exchangeCodeForToken(code);
    console.log('✅ Microsoft Graph token received');

    // Get user profile
    console.log('🔄 Step 2: Getting user profile from Microsoft Graph...');
    const userProfile = await msGraph.getUserProfile(tokenResponse.accessToken);
    console.log('✅ User profile received:', userProfile.email);

    // Save email account to database
    console.log('🔄 Step 3: Saving email account to database...');
    try {
      // First, try to delete any existing account for this user/email combination
      await db
        .delete(emailAccounts)
        .where(
          and(
            eq(emailAccounts.userId, user.id),
            eq(emailAccounts.emailAddress, userProfile.email)
          )
        );

      // Then insert the new account
      const newAccount = await db
        .insert(emailAccounts)
        .values({
          userId: user.id,
          provider: 'microsoft',
          authType: 'oauth',
          emailAddress: userProfile.email,
          displayName: userProfile.displayName,
          accessToken: tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken,
          tokenExpiresAt: new Date(Date.now() + tokenResponse.expiresIn * 1000),
          status: 'active',
        })
        .returning();

      console.log('✅ Email account saved successfully:', newAccount[0]?.id);

      // Subscribe to webhook notifications for real-time email updates
      if (newAccount[0]?.id) {
        console.log('🔄 Step 4: Subscribing to webhook notifications...');
        try {
          const webhookResult = await subscribeToWebhook({
            accountId: newAccount[0].id,
            accessToken: tokenResponse.accessToken,
          });

          if (webhookResult.success) {
            console.log('✅ Webhook subscription created:', webhookResult.subscriptionId);
            console.log('📅 Expires at:', webhookResult.expiresAt);
          } else {
            console.error('⚠️ Webhook subscription failed:', webhookResult.error);
            // Don't fail the entire flow if webhook fails
          }
        } catch (webhookError) {
          console.error('⚠️ Webhook subscription error:', webhookError);
          // Don't fail the entire flow if webhook fails
        }
      }
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      throw dbError;
    }

    // Redirect to email accounts page with success message
    console.log(
      '🔄 Step 5: Redirecting to email accounts page with success...'
    );
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings?tab=email-accounts&success=true&email=${encodeURIComponent(userProfile.email)}`,
        request.url
      )
    );
  } catch (error) {
    console.error('❌ Microsoft Graph callback error:', error);
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
