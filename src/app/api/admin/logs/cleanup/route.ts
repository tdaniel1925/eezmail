import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin/auth';
import { db } from '@/db';
import { adminLogs } from '@/db/schema';
import { lt, sql } from 'drizzle-orm';

export async function POST(request: NextRequest): Promise<NextResponse> {
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
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { olderThan = '30d' } = body;

    // Calculate cutoff date
    const now = new Date();
    let cutoffDate = new Date();
    switch (olderThan) {
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get count before deletion
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(adminLogs)
      .where(lt(adminLogs.createdAt, cutoffDate));

    const deletedCount = Number(countResult[0]?.count || 0);

    // Delete old logs
    if (deletedCount > 0) {
      await db.delete(adminLogs).where(lt(adminLogs.createdAt, cutoffDate));
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error) {
    console.error('Error cleaning up logs:', error);
    return NextResponse.json(
      { error: 'Failed to clean up logs' },
      { status: 500 }
    );
  }
}

