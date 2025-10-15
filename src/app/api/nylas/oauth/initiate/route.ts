import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Nylas from 'nylas';

const nylas = new Nylas({
  apiKey: process.env.NYLAS_API_KEY!,
  apiUri: process.env.NYLAS_API_URI || 'https://api.us.nylas.com',
});

/**
 * POST /api/nylas/oauth/initiate
 * Initiates the Nylas OAuth flow for connecting an email account
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { provider } = body;

    if (
      !provider ||
      !['gmail', 'microsoft', 'yahoo', 'imap'].includes(provider)
    ) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Build redirect URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${appUrl}/api/nylas/callback`;

    // Generate OAuth URL based on provider
    let authUrl = '';

    if (provider === 'gmail') {
      authUrl = nylas.auth.urlForOAuth2({
        clientId: process.env.NYLAS_CLIENT_ID!,
        redirectUri,
        provider: 'google',
        scope: ['email', 'calendar'],
        state: JSON.stringify({ userId: user.id, provider: 'gmail' }),
      });
    } else if (provider === 'microsoft') {
      authUrl = nylas.auth.urlForOAuth2({
        clientId: process.env.NYLAS_CLIENT_ID!,
        redirectUri,
        provider: 'microsoft',
        scope: ['email', 'calendar'],
        state: JSON.stringify({ userId: user.id, provider: 'microsoft' }),
      });
    } else if (provider === 'yahoo') {
      // Yahoo is not a standard provider in Nylas, use IMAP instead
      return NextResponse.json({
        success: true,
        type: 'custom',
        redirectUrl: `/dashboard/settings/email/imap-setup?provider=yahoo&userId=${user.id}`,
      });
    } else if (provider === 'imap') {
      // For IMAP, we'll redirect to a custom setup page
      return NextResponse.json({
        success: true,
        type: 'custom',
        redirectUrl: `/dashboard/settings/email/imap-setup?userId=${user.id}`,
      });
    }

    return NextResponse.json({
      success: true,
      type: 'oauth',
      authUrl,
    });
  } catch (error) {
    console.error('Error initiating OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}
