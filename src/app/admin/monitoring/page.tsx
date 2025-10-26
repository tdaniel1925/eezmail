/**
 * Monitoring Dashboard Page
 * Real-time system metrics and alerts
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { alertRules, alertEvents, systemMetrics } from '@/db/schema';
import { desc, eq, and, gte } from 'drizzle-orm';
import { MetricsOverview } from '@/components/admin/MetricsOverview';
import { ActiveAlerts } from '@/components/admin/ActiveAlerts';
import { MetricCharts } from '@/components/admin/MetricCharts';
import { Button } from '@/components/ui/button';
import { Activity, Plus } from 'lucide-react';
import Link from 'next/link';

export default async function MonitoringPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'super_admin' && userData?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Get active alerts (not resolved)
  const activeAlerts = await db
    .select({
      alert: alertEvents,
      rule: alertRules,
    })
    .from(alertEvents)
    .leftJoin(alertRules, eq(alertEvents.alertRuleId, alertRules.id))
    .where(eq(alertEvents.resolvedAt, null))
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

  // Calculate system stats
  const stats = {
    totalAlerts: activeAlerts.length,
    criticalAlerts: activeAlerts.filter((a) => a.alert.severity === 'critical')
      .length,
    activeRules: await db
      .select()
      .from(alertRules)
      .where(eq(alertRules.enabled, true))
      .then((r) => r.length),
    systemHealth: calculateSystemHealth(recentMetrics),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                System Monitoring
              </h1>
              <p className="text-sm text-gray-500">
                Real-time metrics and alerts
              </p>
            </div>
          </div>

          <Link href="/admin/monitoring/alerts">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Configure Alerts
            </Button>
          </Link>
        </div>

        {/* Overview Cards */}
        <MetricsOverview stats={stats} />

        {/* Active Alerts */}
        <Suspense fallback={<div>Loading alerts...</div>}>
          <ActiveAlerts alerts={activeAlerts} />
        </Suspense>

        {/* Metric Charts */}
        <Suspense fallback={<div>Loading charts...</div>}>
          <MetricCharts metrics={recentMetrics} />
        </Suspense>
      </div>
    </div>
  );
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
