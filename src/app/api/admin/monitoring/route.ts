import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin/auth';
import { db } from '@/db';
import { alertRules, alertEvents, systemMetrics } from '@/db/schema';
import { desc, eq, gte, isNull } from 'drizzle-orm';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get active alerts (not resolved)
    const activeAlerts = await db
      .select({
        alert: alertEvents,
        rule: alertRules,
      })
      .from(alertEvents)
      .leftJoin(alertRules, eq(alertEvents.alertRuleId, alertRules.id))
      .where(isNull(alertEvents.resolvedAt))
      .orderBy(desc(alertEvents.triggeredAt))
      .limit(10);

    // Get recent metrics (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentMetrics = await db
      .select()
      .from(systemMetrics)
      .where(gte(systemMetrics.timestamp, oneHourAgo))
      .orderBy(desc(systemMetrics.timestamp))
      .limit(100);

    // Get active rules count
    const activeRules = await db
      .select()
      .from(alertRules)
      .where(eq(alertRules.enabled, true));

    // Calculate system health
    const systemHealth = calculateSystemHealth(recentMetrics);

    const stats = {
      totalAlerts: activeAlerts.length,
      criticalAlerts: activeAlerts.filter(
        (a) => a.alert.severity === 'critical'
      ).length,
      activeRules: activeRules.length,
      systemHealth,
    };

    return NextResponse.json({
      stats,
      activeAlerts,
      recentMetrics,
    });
  } catch (error) {
    console.error('[Admin Monitoring API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monitoring data' },
      { status: 500 }
    );
  }
}

function calculateSystemHealth(
  metrics: Array<{
    metric: string;
    value: number;
    timestamp: Date;
  }>
): 'healthy' | 'warning' | 'critical' {
  if (metrics.length === 0) return 'healthy';

  // Simple health calculation based on recent errors
  const errorMetrics = metrics.filter((m) => m.metric.includes('error'));
  const errorRate = errorMetrics.length / metrics.length;

  if (errorRate > 0.1) return 'critical';
  if (errorRate > 0.05) return 'warning';
  return 'healthy';
}
