'use client';

/**
 * Audit Stats Cards Component
 * Displays audit statistics in card format
 */

import type { AuditStatistics } from '@/lib/audit/types';
import { Activity, AlertTriangle, Users, TrendingUp } from 'lucide-react';

interface AuditStatsCardsProps {
  stats: AuditStatistics;
}

export function AuditStatsCards({ stats }: AuditStatsCardsProps) {
  const highRiskCount =
    (stats.actionsByRisk.high || 0) + (stats.actionsByRisk.critical || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Total Actions */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Actions</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.totalActions.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </div>
          <div className="rounded-full bg-blue-100 p-3">
            <Activity className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* High Risk Actions */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">High Risk</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {highRiskCount.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.totalActions > 0
                ? ((highRiskCount / stats.totalActions) * 100).toFixed(1)
                : 0}
              % of total
            </p>
          </div>
          <div className="rounded-full bg-orange-100 p-3">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Active Users */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Active Actors</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.topActors.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.topActors[0]?.actorEmail.split('@')[0] || 'N/A'}
            </p>
          </div>
          <div className="rounded-full bg-green-100 p-3">
            <Users className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Top Action */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Top Action</p>
            <p className="text-2xl font-bold text-gray-900 mt-2 truncate">
              {Object.entries(stats.actionsByType).sort(
                ([, a], [, b]) => b - a
              )[0]?.[0] || 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {Object.entries(stats.actionsByType).sort(
                ([, a], [, b]) => b - a
              )[0]?.[1] || 0}{' '}
              times
            </p>
          </div>
          <div className="rounded-full bg-purple-100 p-3">
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
