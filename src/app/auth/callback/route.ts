import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('[OAuth Callback] Error:', error, errorDescription);
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(error)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    
    try {
      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('[OAuth Callback] Exchange error:', exchangeError);
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=oauth_failed`
        );
      }

      console.log('[OAuth Callback] ✅ Session created for:', data.user?.email);
      
      // Successful authentication, redirect to dashboard
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
    } catch (error) {
      console.error('[OAuth Callback] Unexpected error:', error);
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=unexpected_error`
      );
    }
  }

  // No code or error, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login`);
}

