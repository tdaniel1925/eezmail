import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/calendar/google-calendar';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/settings?tab=calendar&error=${error}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?tab=calendar&error=no_code', request.url)
    );
  }

  const result = await exchangeCodeForTokens(code);

  if (result.success) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?tab=calendar&success=google_connected', request.url)
    );
  } else {
    return NextResponse.redirect(
      new URL(`/dashboard/settings?tab=calendar&error=${result.error}`, request.url)
    );
  }
}
