import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema';

/**
 * Auth callback route for Supabase
 * Handles OAuth redirects, email confirmations, and password resets
 * Also ensures user exists in public.users table
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';
  const origin = requestUrl.origin;

  console.log('[AUTH CALLBACK] Processing callback with code:', code ? 'present' : 'missing');

  if (code) {
    const supabase = await createClient();
    
    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[AUTH CALLBACK] Error exchanging code:', error);
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    if (data.user) {
      console.log('[AUTH CALLBACK] User authenticated:', data.user.email);

      // Ensure user exists in public.users table
      try {
        await db
          .insert(users)
          .values({
            id: data.user.id,
            email: data.user.email || '',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoNothing();
        
        console.log('[AUTH CALLBACK] User synced to database');
      } catch (dbError) {
        console.error('[AUTH CALLBACK] Error syncing user to database:', dbError);
        // Don't fail the auth flow, just log the error
      }
    }

    // Redirect to destination
    console.log('[AUTH CALLBACK] Redirecting to:', next);
    return NextResponse.redirect(`${origin}${next}`);
  }

  // No code present, redirect to login
  console.log('[AUTH CALLBACK] No code present, redirecting to login');
  return NextResponse.redirect(`${origin}/login`);
}

