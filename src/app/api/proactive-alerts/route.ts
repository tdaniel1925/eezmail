import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { proactiveAlerts, emailAccounts } from '@/db/schema';
import { eq, and, desc, or } from 'drizzle-orm';
import { z } from 'zod';

export const runtime = 'nodejs';
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

    // Fetch alerts
    const alerts = await db
      .select()
      .from(proactiveAlerts)
      .where(and(...conditions))
      .orderBy(desc(proactiveAlerts.createdAt))
      .limit(validatedData.limit);

    // Get counts by type
    const allAlerts = await db
      .select()
      .from(proactiveAlerts)
      .where(eq(proactiveAlerts.userId, user.id));

    const counts = {
      total: allAlerts.length,
      undismissed: allAlerts.filter((a) => !a.dismissed).length,
      dismissed: allAlerts.filter((a) => a.dismissed).length,
      byType: {
        vip_email: allAlerts.filter((a) => a.type === 'vip_email').length,
        overdue_response: allAlerts.filter((a) => a.type === 'overdue_response')
          .length,
        meeting_prep: allAlerts.filter((a) => a.type === 'meeting_prep').length,
        urgent_keyword: allAlerts.filter((a) => a.type === 'urgent_keyword')
          .length,
        follow_up_needed: allAlerts.filter((a) => a.type === 'follow_up_needed')
          .length,
        deadline_approaching: allAlerts.filter(
          (a) => a.type === 'deadline_approaching'
        ).length,
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
