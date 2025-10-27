import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { sql, gte } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('[Admin Analytics API] Starting analytics fetch...');

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log('[Admin Analytics API] User:', user?.id);

    if (!user) {
      console.log('[Admin Analytics API] No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminCheck = await isAdmin();
    console.log('[Admin Analytics API] Admin check:', adminCheck);

    if (!adminCheck) {
      console.log('[Admin Analytics API] User is not admin');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('[Admin Analytics API] Fetching users...');

    // Get total users
    const allUsers = await db.select().from(users);
    const totalUsers = allUsers.length;

    console.log('[Admin Analytics API] Total users:', totalUsers);

    // Get active users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = allUsers.filter((u) => {
      if (!u.lastLoginAt) return false;
      return new Date(u.lastLoginAt) >= thirtyDaysAgo;
    }).length;

    console.log('[Admin Analytics API] Active users:', activeUsers);

    // Calculate engagement rate (active / total * 100)
    const engagementRate =
      totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

    // Average revenue (placeholder - would need subscriptions data)
    const avgRevenue = 0; // TODO: Calculate from subscriptions

    const stats = {
      totalUsers,
      activeUsers,
      avgRevenue,
      engagementRate,
    };

    console.log('[Admin Analytics API] Returning stats:', stats);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('[Admin Analytics API] Error:', error);
    console.error(
      '[Admin Analytics API] Error stack:',
      error instanceof Error ? error.stack : 'No stack'
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
