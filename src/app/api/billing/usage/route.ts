import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMonthlyUsage } from '@/lib/usage/tracker';
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

    // Get current tier
    const tierResult = await db.execute(sql`
      SELECT COALESCE(s.tier, 'free') as tier
      FROM auth.users u
      LEFT JOIN subscriptions s ON s.user_id = u.id
      WHERE u.id = ${user.id}
    `);
    const tier = tierResult.rows[0]?.tier || 'free';

    // Get usage stats
    const usageResult = await getMonthlyUsage(user.id);
    
    let ragSearches = 0;
    let aiQueries = 0;

    if (usageResult.success && usageResult.usage) {
      usageResult.usage.forEach((stat) => {
        if (stat.resourceType === 'rag_search') {
          ragSearches = stat.totalQuantity;
        } else if (stat.resourceType === 'ai_query') {
          aiQueries = stat.totalQuantity;
        }
      });
    }

    // Get emails stored
    const emailsResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM emails
      WHERE user_id = ${user.id}
    `);
    const emailsStored = parseInt(emailsResult.rows[0]?.count || '0');

    return NextResponse.json({
      usage: {
        ragSearches,
        aiQueries,
        emailsStored,
        tier,
      },
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}

