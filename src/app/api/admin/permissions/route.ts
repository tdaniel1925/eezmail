import { NextRequest, NextResponse } from 'next/server';
import { getAllPermissions } from '@/lib/auth/permission-service';
import { createClient } from '@/lib/supabase/server';
import { hasPermission } from '@/lib/auth/permission-service';
import { db } from '@/lib/db';
import { permissions } from '@/db/schema';

/**
 * GET /api/admin/permissions
 * List all permissions
 */
export async function GET(request: NextRequest) {
  try {
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

    const allPermissions = await getAllPermissions();

    // Group by category
    const grouped = allPermissions.reduce(
      (acc, perm) => {
        const category = perm.category || 'other';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(perm);
        return acc;
      },
      {} as Record<string, typeof allPermissions>
    );

    return NextResponse.json({ permissions: allPermissions, grouped });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/permissions
 * Create a new permission (admin only)
 */
export async function POST(request: NextRequest) {
  try {
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
    const { code, name, description, category } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Code and name are required' },
        { status: 400 }
      );
    }

    const [newPermission] = await db
      .insert(permissions)
      .values({
        code,
        name,
        description,
        category,
      })
      .returning();

    return NextResponse.json({ permission: newPermission });
  } catch (error) {
    console.error('Error creating permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
