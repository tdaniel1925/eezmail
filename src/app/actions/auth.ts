'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Server action for login
 * Handles authentication server-side to ensure cookies are set correctly
 * Supports ONLY username login (email not accepted)
 */
export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  console.log('[SERVER AUTH] Login attempt for username:', username);

  // Validate username format
  if (!username || username.length < 3) {
    return { error: 'Username must be at least 3 characters' };
  }

  // Look up email from username
  let email: string;
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.username, username.toLowerCase()),
      columns: {
        email: true,
      },
    });

    if (!user) {
      console.error('[SERVER AUTH] Username not found:', username);
      return {
        error:
          'Username not found. Please check your username or contact support.',
      };
    }

    email = user.email;
    console.log('[SERVER AUTH] Found email for username:', email);
  } catch (error) {
    console.error('[SERVER AUTH] Error looking up username:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Provide specific error messages
    if (errorMessage.includes('relation') || errorMessage.includes('column')) {
      return {
        error:
          'Database schema issue. Please run the USERNAME_ONLY_AUTH_MIGRATION.sql migration first.',
      };
    }

    return {
      error: `Database error: ${errorMessage}`,
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('[SERVER AUTH] Login error:', error.message);
    return { error: 'Invalid username or password' };
  }

  console.log('[SERVER AUTH] Login successful:', data.user?.email);
  console.log('[SERVER AUTH] Session created, redirecting to dashboard');

  // Session is now stored in server cookies
  redirect('/dashboard');
}

/**
 * Server action for signup
 * Handles user registration server-side with username
 */
export async function signupAction(formData: FormData) {
  const email = formData.get('email') as string;
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const fullName =
    (formData.get('fullName') as string) || `${firstName} ${lastName}`;

  console.log(
    '[SERVER AUTH] Signup attempt for:',
    email,
    'username:',
    username
  );

  // Validate required fields
  if (!firstName || !lastName) {
    return { error: 'First name and last name are required' };
  }

  // Validate username format
  const usernameRegex = /^[a-z0-9_]{3,30}$/;
  if (!username || !usernameRegex.test(username)) {
    return {
      error:
        'Username must be 3-30 characters long and contain only lowercase letters, numbers, and underscores',
    };
  }

  // Check if username already exists
  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, username.toLowerCase()),
    });

    if (existingUser) {
      return {
        error: `Username "${username}" is already taken. Please choose another.`,
      };
    }
  } catch (error) {
    console.error('[SERVER AUTH] Error checking username:', error);
    return { error: 'Failed to validate username. Please try again.' };
  }

  const supabase = await createClient();

  // Create user in Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        username: username.toLowerCase(),
      },
    },
  });

  if (error) {
    console.error('[SERVER AUTH] Signup error:', error.message);
    return { error: error.message };
  }

  if (!data.user) {
    return { error: 'Failed to create user account' };
  }

  console.log('[SERVER AUTH] Supabase user created:', data.user.email);

  // Create user in database with username
  try {
    await db
      .insert(users)
      .values({
        id: data.user.id,
        email: email,
        username: username.toLowerCase(),
        fullName: fullName,
        firstName: firstName,
        lastName: lastName,
        name: fullName,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          username: username.toLowerCase(),
          fullName: fullName,
          firstName: firstName,
          lastName: lastName,
          name: fullName,
          updatedAt: new Date(),
        },
      });

    console.log('[SERVER AUTH] User synced to database with username');
  } catch (dbError) {
    console.error('[SERVER AUTH] Database sync error:', dbError);
    // Continue anyway - the auth callback will try again
  }

  // If email confirmation is disabled, redirect to dashboard
  if (data.session) {
    console.log('[SERVER AUTH] Auto-confirmed, redirecting to dashboard');
    redirect('/dashboard');
  }

  // Otherwise, show confirmation message
  return {
    success: true,
    message: 'Please check your email to confirm your account.',
  };
}
