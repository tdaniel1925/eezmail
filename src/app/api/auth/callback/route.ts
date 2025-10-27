import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateUsername } from '@/lib/auth/username-service';

/**
 * Auth callback route for Supabase
 * Handles OAuth redirects, email confirmations, and password resets
 * Also ensures user exists in public.users table with username
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
        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
          where: eq(users.id, data.user.id),
        });

        if (!existingUser) {
          // Generate username from metadata or email
          const metadataUsername = data.user.user_metadata?.username;
          const fullName = data.user.user_metadata?.full_name || data.user.user_metadata?.name;
          
          let username: string;
          if (metadataUsername) {
            username = metadataUsername;
          } else {
            // Generate from email
            username = await generateUsername(data.user.email || 'user');
          }

          console.log('[AUTH CALLBACK] Creating new user with username:', username);

          await db
            .insert(users)
            .values({
              id: data.user.id,
              email: data.user.email || '',
              username: username.toLowerCase(),
              fullName: fullName,
              name: fullName,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .onConflictDoNothing();
          
          console.log('[AUTH CALLBACK] User created in database');
        } else if (!existingUser.username) {
          // User exists but has no username - generate one
          const username = await generateUsername(existingUser.email);
          console.log('[AUTH CALLBACK] Updating existing user with username:', username);
          
          await db
            .update(users)
            .set({
              username: username.toLowerCase(),
              updatedAt: new Date(),
            })
            .where(eq(users.id, data.user.id));
          
          console.log('[AUTH CALLBACK] Username added to existing user');
        } else {
          console.log('[AUTH CALLBACK] User already exists with username');
        }
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

