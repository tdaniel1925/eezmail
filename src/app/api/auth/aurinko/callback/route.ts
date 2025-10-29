import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';

/**
 * GET /api/auth/aurinko/callback
 * Handles OAuth callback from Aurinko after user authorizes
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // user ID
  const error = searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    console.error('❌ Aurinko OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=oauth_${error}`, req.url)
    );
  }

  if (!code || !state) {
    console.error('❌ Missing code or state in Aurinko callback');
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=oauth_invalid', req.url)
    );
  }

  try {
    // Verify user authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== state) {
      console.error('❌ User ID mismatch in Aurinko callback');
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=unauthorized', req.url)
      );
    }

    // Exchange authorization code for access token
    console.log('🔵 Exchanging Aurinko authorization code for tokens...');

    const tokenResponse = await fetch('https://api.aurinko.io/v1/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        clientId: process.env.AURINKO_CLIENT_ID,
        clientSecret: process.env.AURINKO_CLIENT_SECRET,
        redirectUri: process.env.AURINKO_REDIRECT_URI,
        grantType: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Aurinko token exchange failed:', errorText);
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=token_exchange_failed', req.url)
      );
    }

    const tokens = await tokenResponse.json();

    // Get account details from Aurinko
    console.log('🔵 Fetching Aurinko account details...');

    const accountResponse = await fetch('https://api.aurinko.io/v1/account', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });

    if (!accountResponse.ok) {
      const errorText = await accountResponse.text();
      console.error('❌ Failed to fetch Aurinko account details:', errorText);
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=account_fetch_failed', req.url)
      );
    }

    const accountInfo = await accountResponse.json();

    console.log('✅ Aurinko account details:', {
      id: accountInfo.id,
      email: accountInfo.email,
      serviceType: accountInfo.serviceType,
    });

    // Check if account already exists
    const existingAccount = await db.query.emailAccounts.findFirst({
      where: (accounts, { eq, and }) =>
        and(
          eq(accounts.userId, user.id),
          eq(accounts.emailAddress, accountInfo.email)
        ),
    });

    if (existingAccount) {
      console.log(
        '⚠️ Account already exists, updating with Aurinko details...'
      );

      // Update existing account with Aurinko details
      await db
        .update(emailAccounts)
        .set({
          aurinkoAccountId: accountInfo.id,
          aurinkoAccessToken: tokens.accessToken,
          aurinkoRefreshToken: tokens.refreshToken,
          aurinkoProvider: accountInfo.serviceType,
          useAurinko: true,
          aurinkoTokenExpiresAt: tokens.expiresIn
            ? new Date(Date.now() + tokens.expiresIn * 1000)
            : null,
          status: 'active',
          updatedAt: new Date(),
        })
        .where((accounts, { eq }) => eq(accounts.id, existingAccount.id));

      console.log('✅ Updated existing account with Aurinko integration');

      // Trigger initial sync
      try {
        await fetch(`${process.env.NEXT_PUBLIC_URL}/api/aurinko/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountId: existingAccount.id }),
        });
      } catch (syncError) {
        console.error('⚠️ Failed to trigger initial sync:', syncError);
      }

      return NextResponse.redirect(
        new URL(
          `/dashboard/settings?success=connected&provider=aurinko&email=${encodeURIComponent(accountInfo.email)}`,
          req.url
        )
      );
    }

    // Create new email account
    console.log('🔵 Creating new Aurinko email account...');

    const [newAccount] = await db
      .insert(emailAccounts)
      .values({
        userId: user.id,
        emailAddress: accountInfo.email,
        displayName: accountInfo.name || accountInfo.email,
        provider: 'imap', // Map to our enum
        authType: 'oauth',

        // Aurinko-specific fields
        aurinkoAccountId: accountInfo.id,
        aurinkoAccessToken: tokens.accessToken,
        aurinkoRefreshToken: tokens.refreshToken,
        aurinkoProvider: accountInfo.serviceType,
        useAurinko: true,
        aurinkoTokenExpiresAt: tokens.expiresIn
          ? new Date(Date.now() + tokens.expiresIn * 1000)
          : null,

        status: 'active',
      })
      .returning();

    console.log('✅ Created new Aurinko email account:', newAccount.id);

    // Trigger initial sync
    try {
      console.log('🔵 Triggering initial sync for new account...');
      await fetch(`${process.env.NEXT_PUBLIC_URL}/api/aurinko/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: newAccount.id }),
      });
    } catch (syncError) {
      console.error('⚠️ Failed to trigger initial sync:', syncError);
      // Don't fail the whole flow if sync fails
    }

    return NextResponse.redirect(
      new URL(
        `/dashboard/settings?success=connected&provider=aurinko&email=${encodeURIComponent(accountInfo.email)}`,
        req.url
      )
    );
  } catch (error) {
    console.error('❌ Error in Aurinko OAuth callback:', error);
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings?error=connection_failed&details=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`,
        req.url
      )
    );
  }
}
