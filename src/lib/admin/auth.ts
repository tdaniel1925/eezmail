'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log('[isAdmin] ❌ No user found');
      return false;
    }

    // Get user role from metadata or database
    // First check user metadata (set during signup or by another admin)
    const role = user.user_metadata?.role || user.app_metadata?.role;
    console.log('[isAdmin] 🔍 Checking user:', user.email);
    console.log('[isAdmin] 📋 Metadata role:', role);

    if (role === 'admin') {
      console.log('[isAdmin] ✅ Admin via metadata');
      return true;
    }

    // Fallback: check database (if role is stored in a separate table)
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('[isAdmin] 🗄️  Database role:', data?.role);
    if (error) {
      console.error('[isAdmin] ⚠️  Database error:', error);
    }

    const isAdminUser = data?.role === 'admin';
    console.log(
      '[isAdmin]',
      isAdminUser ? '✅ Admin via database' : '❌ Not admin'
    );

    return isAdminUser;
  } catch (error) {
    console.error('[isAdmin] ❌ Error checking admin status:', error);
    return false;
  }
}

/**
 * Require admin access - throws error if not admin
 */
export async function requireAdmin(): Promise<void> {
  const isAdminUser = await isAdmin();

  if (!isAdminUser) {
    throw new Error('Unauthorized: Admin access required');
  }
}

/**
 * Get current admin user
 */
export async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  const isAdminUser = await isAdmin();

  if (!isAdminUser) {
    throw new Error('Unauthorized: Admin access required');
  }

  return user;
}
