import { NextResponse } from 'next/server';

/**
 * GET /api/test-aurinko
 * Test Aurinko configuration and API connection
 */
export async function GET() {
  try {
    // Check environment variables
    const hasClientId = !!process.env.AURINKO_CLIENT_ID;
    const hasClientSecret = !!process.env.AURINKO_CLIENT_SECRET;
    const hasRedirectUri = !!process.env.AURINKO_REDIRECT_URI;

    const config = {
      clientIdConfigured: hasClientId,
      clientSecretConfigured: hasClientSecret,
      redirectUriConfigured: hasRedirectUri,
      redirectUri: process.env.AURINKO_REDIRECT_URI || 'Not configured',
    };

    if (!hasClientId || !hasClientSecret || !hasRedirectUri) {
      return NextResponse.json({
        success: false,
        error: 'Aurinko not fully configured',
        config,
        message:
          'Please set AURINKO_CLIENT_ID, AURINKO_CLIENT_SECRET, and AURINKO_REDIRECT_URI in your .env.local file',
      });
    }

    // Test API connection
    try {
      const response = await fetch('https://api.aurinko.io/v1/ping', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const isApiReachable = response.ok;

      return NextResponse.json({
        success: true,
        message: 'Aurinko is configured correctly',
        config,
        apiStatus: isApiReachable ? 'reachable' : 'unreachable',
        connectUrl: `/api/auth/aurinko/connect`,
      });
    } catch (apiError) {
      return NextResponse.json({
        success: false,
        error: 'Cannot reach Aurinko API',
        config,
        apiError:
          apiError instanceof Error ? apiError.message : 'Unknown error',
      });
    }
  } catch (error) {
    console.error('Error testing Aurinko:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
