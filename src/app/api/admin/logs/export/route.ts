import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin/auth';
import { db } from '@/db';
import { adminAuditLog } from '@/db/schema';
import { desc, and, eq, gte, sql } from 'drizzle-orm';

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
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const level = searchParams.get('level') || 'all';
    const category = searchParams.get('category') || 'all';
    const timeRange = searchParams.get('timeRange') || '24h';

    // Calculate time range
    const now = new Date();
    let sinceDate = new Date();
    switch (timeRange) {
      case '1h':
        sinceDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        sinceDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        sinceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        sinceDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        sinceDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Build query conditions
    const conditions = [gte(adminAuditLog.createdAt, sinceDate)];

    if (level !== 'all') {
      conditions.push(eq(adminAuditLog.level, level as any));
    }

    if (category !== 'all') {
      conditions.push(eq(adminAuditLog.category, category));
    }

    if (query) {
      conditions.push(sql`${adminAuditLog.message} ILIKE ${'%' + query + '%'}`);
    }

    // Fetch logs
    const logs = await db
      .select()
      .from(adminAuditLog)
      .where(and(...conditions))
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(10000); // Larger limit for export

    // Convert to JSON
    const jsonData = JSON.stringify(logs, null, 2);

    // Return as downloadable file
    return new NextResponse(jsonData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="logs-${new Date().toISOString()}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting logs:', error);
    return NextResponse.json(
      { error: 'Failed to export logs' },
      { status: 500 }
    );
  }
}
