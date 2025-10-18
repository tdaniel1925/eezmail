import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get subscription data
    const result = await db.execute(sql`
      SELECT
        COALESCE(s.tier, 'free') as tier,
        COALESCE(s.status, 'active') as status,
        s.current_period_end,
        s.cancel_at_period_end,
        s.processor
      FROM auth.users u
      LEFT JOIN subscriptions s ON s.user_id = u.id
      WHERE u.id = ${user.id}
    `);

    const subscription = result.rows[0] || {
      tier: 'free',
      status: 'active',
      current_period_end: null,
      cancel_at_period_end: false,
      processor: null,
    };

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

