import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema';

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
      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('[OAuth Callback] Exchange error:', exchangeError);
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=oauth_failed`
        );
      }

      console.log('[OAuth Callback] ✅ Session created for:', data.user?.email);

      // Ensure user exists in public.users table
      if (data.user) {
        try {
          await db
            .insert(users)
            .values({
              id: data.user.id,
              email: data.user.email!,
              fullName:
                data.user.user_metadata?.full_name ||
                data.user.user_metadata?.name ||
                data.user.email!.split('@')[0],
              roleHierarchy: 'user', // Default role for OAuth users
            })
            .onConflictDoNothing(); // Skip if user already exists

          console.log('[OAuth Callback] ✅ User provisioned:', data.user.email);
        } catch (provisionError) {
          console.error('[OAuth Callback] Provisioning error:', provisionError);
          // Continue anyway - user might already exist
        }
      }

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
