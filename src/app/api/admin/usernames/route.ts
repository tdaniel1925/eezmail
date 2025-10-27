import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { desc, or, ilike } from 'drizzle-orm';
import { isAdmin } from '@/lib/admin/auth';

/**
 * GET /api/admin/usernames
 * Fetch all user credentials (username + email) for admin management
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const userType = searchParams.get('type') || 'all'; // all, regular, sandbox

    // Build where clause
    const whereClause =
      search
        ? or(
            ilike(users.email, `%${search}%`),
            ilike(users.username, `%${search}%`),
            ilike(users.fullName, `%${search}%`)
          )
        : undefined;

    // Fetch users from database
    let allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        roleHierarchy: users.roleHierarchy,
        isSandboxUser: users.isSandboxUser,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.createdAt));

    // Filter by type if specified
    if (userType === 'regular') {
      allUsers = allUsers.filter((u) => !u.isSandboxUser);
    } else if (userType === 'sandbox') {
      allUsers = allUsers.filter((u) => u.isSandboxUser);
    }

    // Calculate stats
    const totalUsers = allUsers.length;
    const regularUsers = allUsers.filter((u) => !u.isSandboxUser).length;
    const sandboxUsers = allUsers.filter((u) => u.isSandboxUser).length;
    const adminUsers = allUsers.filter(
      (u) => u.role === 'admin' || u.role === 'super_admin'
    ).length;

    return NextResponse.json({
      success: true,
      users: allUsers,
      stats: {
        total: totalUsers,
        regular: regularUsers,
        sandbox: sandboxUsers,
        admins: adminUsers,
      },
    });
  } catch (error) {
    console.error('[Admin Usernames API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usernames' },
      { status: 500 }
    );
  }
}

