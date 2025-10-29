import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/auth/aurinko/connect
 * Initiates Aurinko OAuth flow for IMAP and alternative email providers
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Get the actual host from the request (works with ngrok)
      const url = new URL(req.url);
      const loginUrl = new URL('/login?error=unauthorized', url.origin);
      return NextResponse.redirect(loginUrl);
    }

    // Check for required Aurinko environment variables
    const clientId = process.env.AURINKO_CLIENT_ID;
    const redirectUri = process.env.AURINKO_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      console.error('❌ Aurinko configuration missing');
      const url = new URL(req.url);
      const errorUrl = new URL(
        '/dashboard/settings?error=aurinko_not_configured',
        url.origin
      );
      return NextResponse.redirect(errorUrl);
    }

    console.log('🔍 Using redirect URI:', redirectUri);

    // Build Aurinko OAuth authorization URL
    const authUrl = new URL('https://api.aurinko.io/v1/auth/authorize');

    authUrl.searchParams.set('clientId', clientId);
    authUrl.searchParams.set('returnUrl', redirectUri); // Aurinko uses 'returnUrl' not 'redirectUri'
    authUrl.searchParams.set('responseType', 'code');
    authUrl.searchParams.set('state', user.id); // Pass user ID for callback

    // Specify provider type - REQUIRED by Aurinko
    // Can be: 'IMAP', 'Gmail', 'Office365', 'EWS', 'Yahoo', 'iCloud'
    authUrl.searchParams.set('serviceType', 'IMAP');

    // Note: IMAP doesn't use OAuth scopes - it uses direct email/password auth
    // Scopes are only needed for Gmail, Microsoft, etc.

    // Remove any scope parameter if it exists (force clean state)
    authUrl.searchParams.delete('scope');

    const finalUrl = authUrl.toString();
    console.log('🔵 Redirecting to Aurinko OAuth:', finalUrl);
    console.log('🔍 URL Parameters:', {
      clientId,
      returnUrl: redirectUri,
      responseType: 'code',
      serviceType: 'IMAP',
      hasScope: finalUrl.includes('scope'),
    });

    return NextResponse.redirect(finalUrl);
  } catch (error) {
    console.error('Error initiating Aurinko OAuth:', error);
    const url = new URL(req.url);
    const errorUrl = new URL(
      '/dashboard/settings?error=oauth_failed',
      url.origin
    );
    return NextResponse.redirect(errorUrl);
  }
}
