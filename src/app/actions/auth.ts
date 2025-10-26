'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Server action for login
 * Handles authentication server-side to ensure cookies are set correctly
 */
export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  console.log('[SERVER AUTH] Login attempt for:', email);

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
    message: 'Please check your email to confirm your account.' 
  };
}

