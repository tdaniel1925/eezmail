import { NextRequest, NextResponse } from 'next/server';
import {
  getUserPermissions,
  grantPermissionOverride,
  revokePermissionOverride,
} from '@/lib/auth/permission-service';
import { createClient } from '@/lib/supabase/server';
import { hasPermission } from '@/lib/auth/permission-service';

type RouteParams = {
  params: Promise<{
    userId: string;
  }>;
};

/**
 * GET /api/admin/permissions/users/[userId]
 * Get all permissions for a user (role + overrides)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params;

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

    const userPermissions = await getUserPermissions(userId);

    return NextResponse.json({ userId, permissions: userPermissions });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/permissions/users/[userId]
 * Grant a permission override to a user
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params;

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
    const { permissionCode } = body;

    if (!permissionCode) {
      return NextResponse.json(
        { error: 'permissionCode is required' },
        { status: 400 }
      );
    }

    const result = await grantPermissionOverride(
      userId,
      permissionCode,
      user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to grant permission' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, userId, permissionCode });
  } catch (error) {
    console.error('Error granting permission override:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/permissions/users/[userId]
 * Revoke a permission override from a user
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params;

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
    const { permissionCode } = body;

    if (!permissionCode) {
      return NextResponse.json(
        { error: 'permissionCode is required' },
        { status: 400 }
      );
    }

    const result = await revokePermissionOverride(
      userId,
      permissionCode,
      user.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to revoke permission' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, userId, permissionCode });
  } catch (error) {
    console.error('Error revoking permission override:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
