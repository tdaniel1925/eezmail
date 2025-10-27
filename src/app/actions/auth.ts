'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Server action for login
 * Handles authentication server-side to ensure cookies are set correctly
 * Supports both email and username login
 */
export async function loginAction(formData: FormData) {
  let emailOrUsername = formData.get('email') as string;
  const password = formData.get('password') as string;

  console.log('[SERVER AUTH] Login attempt for:', emailOrUsername);

  // Check if input is a username (no @ symbol) or email
  let email = emailOrUsername;
  if (!emailOrUsername.includes('@')) {
    console.log(
      '[SERVER AUTH] Input appears to be username, looking up email...'
    );

    // Look up email from username
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.username, emailOrUsername),
        columns: {
          email: true,
        },
      });

      if (!user) {
        console.error('[SERVER AUTH] Username not found:', emailOrUsername);
        return { 
          error: 'Username not found. Please use your email address or check if migrations have been run in the database.' 
        };
      }

      email = user.email;
      console.log('[SERVER AUTH] Found email for username:', email);
    } catch (error) {
      console.error('[SERVER AUTH] Error looking up username:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[SERVER AUTH] Full error details:', errorMessage);
      
      // Provide more specific error messages
      if (errorMessage.includes('relation') || errorMessage.includes('column')) {
        return { 
          error: 'Database schema issue detected. The username column may not exist yet. Please run database migrations or use your email address to login.' 
        };
      }
      
      return { 
        error: `Database error: ${errorMessage}. Please try using your email address instead.` 
      };
    }
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('[SERVER AUTH] Login error:', error.message);
    return { error: error.message };
  }

  console.log('[SERVER AUTH] Login successful:', data.user?.email);
  console.log('[SERVER AUTH] Session created, redirecting to dashboard');

  // Session is now stored in server cookies for easemail.app domain
  redirect('/dashboard');
}

/**
 * Server action for signup
 * Handles user registration server-side
 */
export async function signupAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;

  console.log('[SERVER AUTH] Signup attempt for:', email);

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    console.error('[SERVER AUTH] Signup error:', error.message);
    return { error: error.message };
  }

  console.log('[SERVER AUTH] Signup successful:', data.user?.email);

  // If email confirmation is disabled, redirect to dashboard
  if (data.session) {
    redirect('/dashboard');
  }

  // Otherwise, show confirmation message
  return {
    success: true,
    message: 'Please check your email to confirm your account.',
  };
}
