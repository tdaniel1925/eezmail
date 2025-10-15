import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  return NextResponse.json({
    message: 'Redirect URI Test',
    currentUrl: url.toString(),
    redirectUri: `${url.protocol}//${url.host}/api/nylas/callback`,
    timestamp: new Date().toISOString(),
  });
}
