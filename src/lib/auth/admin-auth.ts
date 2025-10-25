/**
 * Admin Authentication & Authorization Utilities
 * Provides middleware and helpers for admin-only routes and sandbox management
 */

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { users, adminAuditLog } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// Type definitions
export type UserRole = 'user' | 'sandbox_user' | 'admin' | 'super_admin';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  sandboxCompanyId: string | null;
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'admin' || role === 'super_admin';
}

/**
 * Check if user has super admin privileges
 */
export function isSuperAdmin(role: UserRole): boolean {
  return role === 'super_admin';
}

/**
 * Check if user is a sandbox user
 */
export function isSandboxUser(role: UserRole): boolean {
  return role === 'sandbox_user';
}

/**
 * Get authenticated user with role information
 */
export async function getAuthenticatedUser(): Promise<AdminUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    // Fetch user details from database including role
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        sandboxCompanyId: true,
      },
    });

    if (!dbUser) {
      return null;
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      fullName: dbUser.fullName,
      role: dbUser.role as UserRole,
      sandboxCompanyId: dbUser.sandboxCompanyId,
    };
  } catch (error) {
    console.error('Error fetching authenticated user:', error);
    return null;
  }
}

/**
 * Require admin authentication
 * Returns authenticated admin user or throws error
 */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error('Unauthorized: No user session found');
  }

  if (!isAdmin(user.role)) {
    throw new Error('Forbidden: Admin access required');
  }

  return user;
}

/**
 * Require super admin authentication
 * Returns authenticated super admin user or throws error
 */
export async function requireSuperAdmin(): Promise<AdminUser> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error('Unauthorized: No user session found');
  }

  if (!isSuperAdmin(user.role)) {
    throw new Error('Forbidden: Super Admin access required');
  }

  return user;
}

/**
 * Log admin action to audit trail
 */
export async function logAdminAction(params: {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  };
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await db.insert(adminAuditLog).values({
      adminId: params.adminId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      details: params.details,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    console.log(
      `✅ [Admin Audit] ${params.action} by ${params.adminId} on ${params.targetType}${params.targetId ? ` (${params.targetId})` : ''}`
    );
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't throw - logging failure shouldn't block the action
  }
}

/**
 * Middleware: Require admin access for API routes
 */
export async function withAdminAuth(
  handler: (req: NextRequest, user: AdminUser) => Promise<NextResponse>
): Promise<(req: NextRequest) => Promise<NextResponse>> {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const user = await requireAdmin();
      return await handler(req, user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Access denied';

      if (message.includes('Unauthorized')) {
        return NextResponse.json({ error: message }, { status: 401 });
      }

      return NextResponse.json({ error: message }, { status: 403 });
    }
  };
}

/**
 * Middleware: Require super admin access for API routes
 */
export async function withSuperAdminAuth(
  handler: (req: NextRequest, user: AdminUser) => Promise<NextResponse>
): Promise<(req: NextRequest) => Promise<NextResponse>> {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const user = await requireSuperAdmin();
      return await handler(req, user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Access denied';

      if (message.includes('Unauthorized')) {
        return NextResponse.json({ error: message }, { status: 401 });
      }

      return NextResponse.json({ error: message }, { status: 403 });
    }
  };
}

/**
 * Extract IP address from request
 */
export function getClientIp(req: NextRequest): string | undefined {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return undefined;
}

/**
 * Extract user agent from request
 */
export function getUserAgent(req: NextRequest): string | undefined {
  return req.headers.get('user-agent') || undefined;
}

