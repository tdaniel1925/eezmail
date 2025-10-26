import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Auth callback route for Supabase
 * Handles OAuth redirects and email confirmations
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[AUTH CALLBACK] Error exchanging code:', error);
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
    }

    console.log('[AUTH CALLBACK] Session established, redirecting to:', next);
    return NextResponse.redirect(new URL(next, request.url));
  }

  // No code present, redirect to login
  console.log('[AUTH CALLBACK] No code present, redirecting to login');
  return NextResponse.redirect(new URL('/login', request.url));
}

