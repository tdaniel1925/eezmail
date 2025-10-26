'use client';

/**
 * Metrics Overview Component
 * High-level system health indicators
 */

import { Activity, AlertCircle, CheckCircle, Shield } from 'lucide-react';

interface MetricsOverviewProps {
  stats: {
    totalAlerts: number;
    criticalAlerts: number;
    activeRules: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
  };
}

export function MetricsOverview({ stats }: MetricsOverviewProps) {
  const healthConfig = {
    healthy: {
      color: 'text-green-600',
      bg: 'bg-green-100',
      text: 'Healthy',
      icon: CheckCircle,
    },
    warning: {
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
      text: 'Warning',
      icon: AlertCircle,
    },
    critical: {
      color: 'text-red-600',
      bg: 'bg-red-100',
      text: 'Critical',
      icon: AlertCircle,
    },
  };

  const health = healthConfig[stats.systemHealth];
  const HealthIcon = health.icon;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* System Health */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">System Health</p>
            <p className={`text-3xl font-bold mt-2 ${health.color}`}>
              {health.text}
            </p>
          </div>
          <div className={`rounded-full ${health.bg} p-3`}>
            <HealthIcon className={`h-6 w-6 ${health.color}`} />
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Active Alerts</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.totalAlerts}
            </p>
          </div>
          <div className="rounded-full bg-blue-100 p-3">
            <Activity className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Critical Alerts</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {stats.criticalAlerts}
            </p>
          </div>
          <div className="rounded-full bg-red-100 p-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
        </div>
      </div>

      {/* Active Rules */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Active Rules</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.activeRules}
            </p>
          </div>
          <div className="rounded-full bg-purple-100 p-3">
            <Shield className="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
