/**
 * Platform Admin Middleware
 * Protects platform admin routes
 */

import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { platformAdmins } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function requirePlatformAdmin(): Promise<{
  user: any;
  adminRole: string;
  permissions: any;
} | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    // Check if user is a platform admin
    const admin = await db.query.platformAdmins.findFirst({
      where: eq(platformAdmins.userId, user.id),
    });

    if (!admin) {
      return null;
    }

    return {
      user,
      adminRole: admin.role || 'admin',
      permissions: admin.permissions || {},
    };
  } catch (error) {
    console.error('❌ Error checking platform admin:', error);
    return null;
  }
}

export async function checkPlatformAdminPermission(
  permission: string
): Promise<boolean> {
  try {
    const admin = await requirePlatformAdmin();
    if (!admin) return false;

    // Super admins have all permissions
    if (admin.adminRole === 'super_admin') return true;

    // Check specific permission
    return admin.permissions?.[permission] === true;
  } catch (error) {
    console.error('❌ Error checking permission:', error);
    return false;
  }
}

