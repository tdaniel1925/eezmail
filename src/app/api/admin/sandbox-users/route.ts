import { NextRequest, NextResponse } from 'next/server';
import { createSandboxUser } from '@/lib/admin/sandbox-provisioning';
import { createClient } from '@/lib/supabase/server';
import { hasPermission } from '@/lib/auth/permission-service';

/**
 * POST /api/admin/sandbox-users
 * Create a new sandbox user with auto-generated credentials
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

    // Check if user has permission to manage sandbox
    const canManage = await hasPermission(user.id, 'can_manage_sandbox');
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      email,
      preferredUsername,
      accountType,
      roleHierarchy,
      companyId,
      fullName,
    } = body;

    // Validate required fields
    if (!accountType || !roleHierarchy) {
      return NextResponse.json(
        { error: 'accountType and roleHierarchy are required' },
        { status: 400 }
      );
    }

    // Validate account type
    const validAccountTypes = ['individual', 'team', 'enterprise'];
    if (!validAccountTypes.includes(accountType)) {
      return NextResponse.json(
        { error: 'Invalid account type' },
        { status: 400 }
      );
    }

    // Validate role hierarchy
    const validRoles = [
      'user',
      'team_user',
      'team_admin',
      'team_super_admin',
      'enterprise_user',
      'enterprise_admin',
      'enterprise_super_admin',
    ];
    if (!validRoles.includes(roleHierarchy)) {
      return NextResponse.json(
        { error: 'Invalid role hierarchy' },
        { status: 400 }
      );
    }

    const result = await createSandboxUser({
      email,
      preferredUsername,
      accountType,
      roleHierarchy,
      companyId,
      fullName,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create sandbox user' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: result.userId,
        username: result.username,
        password: result.password,
      },
    });
  } catch (error) {
    console.error('Error creating sandbox user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
