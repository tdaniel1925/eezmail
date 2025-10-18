import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const result = await db.execute(sql`
      WITH plan_prices AS (
        SELECT 'starter' as tier, 15 as price
        UNION ALL SELECT 'professional', 35
        UNION ALL SELECT 'enterprise', 200
      )
      SELECT
        u.id,
        u.email,
        COALESCE(s.tier, 'free') as tier,
        u.created_at as joined_at,
        COALESCE(pp.price, 0) as monthly_revenue,
        COALESCE(pp.price, 0) * 12 as lifetime_value
      FROM auth.users u
      LEFT JOIN subscriptions s ON s.user_id = u.id
      LEFT JOIN plan_prices pp ON pp.tier = s.tier
      WHERE s.status = 'active'
      ORDER BY lifetime_value DESC
      LIMIT 10
    `);

    const customers = (result.rows || []).map((row: any) => ({
      id: row.id,
      email: row.email,
      tier: row.tier,
      revenue: parseFloat(row.lifetime_value || '0'),
      joinedAt: row.joined_at,
    }));

    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Error fetching top customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

