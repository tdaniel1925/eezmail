import { NextRequest, NextResponse } from 'next/server';
import { getRolePermissions } from '@/lib/auth/permission-service';
import { createClient } from '@/lib/supabase/server';
import { hasPermission } from '@/lib/auth/permission-service';
import { db } from '@/lib/db';
import { rolePermissions, permissions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

type RouteParams = {
  params: Promise<{
    role: string;
  }>;
};

/**
 * GET /api/admin/permissions/roles/[role]
 * Get permissions for a specific role
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { role } = await params;

    // Verify user is authenticated and is admin
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view permissions
    const canView = await hasPermission(user.id, 'can_manage_permissions');
    if (!canView) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rolePerms = await getRolePermissions(role);

    return NextResponse.json({ role, permissions: rolePerms });
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/permissions/roles/[role]
 * Bulk update permissions for a role
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { role } = await params;

    // Verify user is authenticated and is admin
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage permissions
    const canManage = await hasPermission(user.id, 'can_manage_permissions');
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { permissionIds } = body as { permissionIds: string[] };

    if (!Array.isArray(permissionIds)) {
      return NextResponse.json(
        { error: 'permissionIds must be an array' },
        { status: 400 }
      );
    }

    // Delete all existing role permissions
    await db
      .delete(rolePermissions)
      .where(eq(rolePermissions.role, role as any));

    // Insert new role permissions
    if (permissionIds.length > 0) {
      await db.insert(rolePermissions).values(
        permissionIds.map((permissionId) => ({
          role: role as any,
          permissionId,
        }))
      );
    }

    return NextResponse.json({
      success: true,
      role,
      permissionCount: permissionIds.length,
    });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
