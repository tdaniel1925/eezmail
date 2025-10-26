import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { proactiveAlerts, emailAccounts } from '@/db/schema';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { z } from 'zod';

// Note: Cannot use Edge Runtime due to Postgres driver dependency on Node.js 'net' module
// export const runtime = 'edge'; // ⚠️ Disabled - postgres requires Node.js runtime
export const dynamic = 'force-dynamic';

// ============================================================================
// GET - Fetch Proactive Alerts
// ============================================================================

const getAlertsSchema = z.object({
  limit: z.number().min(1).max(50).optional().default(10),
  includeDismissed: z.boolean().optional().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeDismissed = searchParams.get('includeDismissed') === 'true';

    const validatedData = getAlertsSchema.parse({ limit, includeDismissed });

    // Build query conditions
    const conditions = [eq(proactiveAlerts.userId, user.id)];

    if (!validatedData.includeDismissed) {
      conditions.push(eq(proactiveAlerts.dismissed, false));
    }

    // ✅ OPTIMIZED: Fetch alerts and counts in parallel
    const [alerts, countResult] = await Promise.all([
      // Fetch limited alerts
      db
        .select()
        .from(proactiveAlerts)
        .where(and(...conditions))
        .orderBy(desc(proactiveAlerts.createdAt))
        .limit(validatedData.limit),

      // Get counts in database (not in JavaScript) - MUCH faster
      db.execute(sql`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE dismissed = FALSE) as undismissed,
          COUNT(*) FILTER (WHERE dismissed = TRUE) as dismissed,
          COUNT(*) FILTER (WHERE type = 'vip_email') as vip_email,
          COUNT(*) FILTER (WHERE type = 'overdue_response') as overdue_response,
          COUNT(*) FILTER (WHERE type = 'meeting_prep') as meeting_prep,
          COUNT(*) FILTER (WHERE type = 'urgent_keyword') as urgent_keyword,
          COUNT(*) FILTER (WHERE type = 'follow_up_needed') as follow_up_needed,
          COUNT(*) FILTER (WHERE type = 'deadline_approaching') as deadline_approaching
        FROM proactive_alerts
        WHERE user_id = ${user.id}
      `),
    ]);

    const countsRow = countResult.rows[0] as any;
    const counts = {
      total: parseInt(countsRow?.total || '0'),
      undismissed: parseInt(countsRow?.undismissed || '0'),
      dismissed: parseInt(countsRow?.dismissed || '0'),
      byType: {
        vip_email: parseInt(countsRow?.vip_email || '0'),
        overdue_response: parseInt(countsRow?.overdue_response || '0'),
        meeting_prep: parseInt(countsRow?.meeting_prep || '0'),
        urgent_keyword: parseInt(countsRow?.urgent_keyword || '0'),
        follow_up_needed: parseInt(countsRow?.follow_up_needed || '0'),
        deadline_approaching: parseInt(countsRow?.deadline_approaching || '0'),
      },
    };

    return NextResponse.json({
      success: true,
      alerts,
      counts,
    });
  } catch (error) {
    console.error('❌ [Proactive Alerts API] GET error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch proactive alerts' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Dismiss Alert
// ============================================================================

const dismissSchema = z.object({
  alertId: z.string().uuid(),
  actedUpon: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { alertId, actedUpon } = dismissSchema.parse(body);

    // Verify alert belongs to user
    const alert = await db.query.proactiveAlerts.findFirst({
      where: and(
        eq(proactiveAlerts.id, alertId),
        eq(proactiveAlerts.userId, user.id)
      ),
    });

    if (!alert) {
      return NextResponse.json(
        { success: false, error: 'Alert not found' },
        { status: 404 }
      );
    }

    // Update alert
    await db
      .update(proactiveAlerts)
      .set({
        dismissed: true,
        dismissedAt: new Date(),
        actedUpon,
        actedUponAt: actedUpon ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(proactiveAlerts.id, alertId));

    return NextResponse.json({
      success: true,
      message: 'Alert dismissed successfully',
    });
  } catch (error) {
    console.error('❌ [Proactive Alerts API] POST error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to dismiss alert' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Dismiss All Alerts
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Dismiss all undismissed alerts for user
    await db
      .update(proactiveAlerts)
      .set({
        dismissed: true,
        dismissedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(proactiveAlerts.userId, user.id),
          eq(proactiveAlerts.dismissed, false)
        )
      );

    return NextResponse.json({
      success: true,
      message: 'All alerts dismissed successfully',
    });
  } catch (error) {
    console.error('❌ [Proactive Alerts API] DELETE error:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to dismiss all alerts' },
      { status: 500 }
    );
  }
}
