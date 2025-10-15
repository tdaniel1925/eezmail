/**
 * Nylas OAuth Initiation Endpoint
 * Generates OAuth URL and redirects user to provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateOAuthUrl } from '@/lib/nylas/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get login hint from query params (optional)
    const searchParams = request.nextUrl.searchParams;
    const loginHint = searchParams.get('email') || undefined;

    // Generate OAuth URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
    const redirectUri = `${appUrl}/api/nylas/callback`;

    const { url, state } = await generateOAuthUrl(redirectUri, loginHint);

    // Store state in session for verification
    // In production, use a proper session store or database
    const response = NextResponse.redirect(url);
    response.cookies.set('nylas_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error) {
    console.error('Nylas OAuth error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth' },
      { status: 500 }
    );
  }
}
