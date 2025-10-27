'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * Check if the current user is an admin (supports both old and new role systems)
 */
export async function isAdmin(): Promise<boolean> {
  try {
    // Get current user from session
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log('[isAdmin] ❌ No user found');
      return false;
    }

    console.log('[isAdmin] 🔍 Checking user:', user.email);

    // Use admin client to query users table (bypasses RLS)
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('users')
      .select('role, role_hierarchy')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('[isAdmin] ⚠️  Database error:', error);
      return false;
    }

    console.log('[isAdmin] 🗄️  Database role:', data?.role);
    console.log('[isAdmin] 🗄️  Role hierarchy:', data?.role_hierarchy);

    // Check new role hierarchy system (preferred)
    const roleHierarchy = data?.role_hierarchy;
    if (
      roleHierarchy === 'system_admin' ||
      roleHierarchy === 'system_super_admin'
    ) {
      console.log('[isAdmin] ✅ Admin via role hierarchy');
      return true;
    }

    // Fallback: check old role system for backwards compatibility
    const role = data?.role;
    if (role === 'admin' || role === 'super_admin') {
      console.log('[isAdmin] ✅ Admin via legacy role');
      return true;
    }

    console.log('[isAdmin] ❌ Not admin');
    return false;
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
