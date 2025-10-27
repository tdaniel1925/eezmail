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
      color: 'text-green-400',
      bg: 'bg-green-500/20 border-green-500/30',
      text: 'Healthy',
      icon: CheckCircle,
    },
    warning: {
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/20 border-yellow-500/30',
      text: 'Warning',
      icon: AlertCircle,
    },
    critical: {
      color: 'text-red-400',
      bg: 'bg-red-500/20 border-red-500/30',
      text: 'Critical',
      icon: AlertCircle,
    },
  };

  const health = healthConfig[stats.systemHealth];
  const HealthIcon = health.icon;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* System Health */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">System Health</p>
            <p className={`text-3xl font-bold mt-2 ${health.color}`}>
              {health.text}
            </p>
          </div>
          <div className={`rounded-full ${health.bg} border p-3`}>
            <HealthIcon className={`h-6 w-6 ${health.color}`} />
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">Active Alerts</p>
            <p className="text-3xl font-bold text-white mt-2">
              {stats.totalAlerts}
            </p>
          </div>
          <div className="rounded-full bg-blue-500/20 border border-blue-500/30 p-3">
            <Activity className="h-6 w-6 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">Critical Alerts</p>
            <p className="text-3xl font-bold text-red-400 mt-2">
              {stats.criticalAlerts}
            </p>
          </div>
          <div className="rounded-full bg-red-500/20 border border-red-500/30 p-3">
            <AlertCircle className="h-6 w-6 text-red-400" />
          </div>
        </div>
      </div>

      {/* Active Rules */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">Active Rules</p>
            <p className="text-3xl font-bold text-white mt-2">
              {stats.activeRules}
            </p>
          </div>
          <div className="rounded-full bg-purple-500/20 border border-purple-500/30 p-3">
            <Shield className="h-6 w-6 text-purple-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
