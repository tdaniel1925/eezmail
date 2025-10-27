'use client';

/**
 * Monitoring Dashboard Page
 * Real-time system metrics and alerts
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MetricsOverview } from '@/components/admin/MetricsOverview';
import { ActiveAlerts } from '@/components/admin/ActiveAlerts';
import { MetricCharts } from '@/components/admin/MetricCharts';
import { Button } from '@/components/ui/button';
import { Activity, Plus } from 'lucide-react';

type SystemStats = {
  totalAlerts: number;
  criticalAlerts: number;
  activeRules: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
};

export default function MonitoringPage() {
  const router = useRouter();
  const [stats, setStats] = useState<SystemStats>({
    totalAlerts: 0,
    criticalAlerts: 0,
    activeRules: 0,
    systemHealth: 'healthy',
  });
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [recentMetrics, setRecentMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMonitoringData() {
      try {
        const response = await fetch('/api/admin/monitoring');
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          if (response.status === 403) {
            router.push('/dashboard');
            return;
          }
          throw new Error('Failed to load monitoring data');
        }
        const data = await response.json();
        setStats(data.stats);
        setActiveAlerts(data.activeAlerts || []);
        setRecentMetrics(data.recentMetrics || []);
      } catch (error) {
        console.error('Error loading monitoring data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadMonitoringData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-3 border border-blue-500/20">
              <Activity className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                System Monitoring
              </h1>
              <p className="text-sm text-gray-400">
                Real-time metrics and alerts
              </p>
            </div>
          </div>

          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => router.push('/admin/monitoring/alerts')}
          >
            <Plus className="h-4 w-4" />
            Configure Alerts
          </Button>
        </div>

        {/* Overview Cards */}
        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading stats...</div>
        ) : (
          <MetricsOverview stats={stats} />
        )}

        {/* Active Alerts */}
        {loading ? (
          <div className="text-gray-400 text-center py-8">
            Loading alerts...
          </div>
        ) : (
          <ActiveAlerts alerts={activeAlerts} />
        )}

        {/* Metric Charts */}
        {loading ? (
          <div className="text-gray-400 text-center py-8">
            Loading charts...
          </div>
        ) : (
          <MetricCharts metrics={recentMetrics} />
        )}
      </div>
    </div>
  );
}
