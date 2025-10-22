'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  Clock,
  Mail,
  Send,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  Calendar,
  Activity,
} from 'lucide-react';
import { EmailVolumeChart } from '@/components/analytics/EmailVolumeChart';
import { ResponseTimeChart } from '@/components/analytics/ResponseTimeChart';
import { TopSendersTable } from '@/components/analytics/TopSendersTable';
import { ProductivityHeatmap } from '@/components/analytics/ProductivityHeatmap';
import { StatsCard } from '@/components/analytics/StatsCard';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const { analytics, isLoading, error, refresh } = useAnalytics(period);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-medium">Failed to load analytics</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !analytics) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 animate-spin text-primary" />
          <p className="text-gray-600 dark:text-gray-300">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Emails Received',
      value: analytics.totalReceived.toString(),
      change: analytics.receiveGrowth,
      icon: Mail,
      color: 'blue',
    },
    {
      title: 'Emails Sent',
      value: analytics.totalSent.toString(),
      change: analytics.sendGrowth,
      icon: Send,
      color: 'green',
    },
    {
      title: 'Avg Response Time',
      value: formatResponseTime(analytics.avgResponseTime),
      change: analytics.responseTimeChange,
      icon: Clock,
      color: 'purple',
      inverse: true, // Lower is better
    },
    {
      title: 'Active Contacts',
      value: analytics.activeContacts.toString(),
      change: analytics.contactsGrowth,
      icon: Users,
      color: 'orange',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              Email Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Insights into your email productivity and patterns
            </p>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  period === p
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {p === '7d' && 'Last 7 Days'}
                {p === '30d' && 'Last 30 Days'}
                {p === '90d' && 'Last 90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmailVolumeChart data={analytics.volumeByDay} period={period} />
          <ResponseTimeChart data={analytics.responseTimeDistribution} />
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProductivityHeatmap data={analytics.emailsByHourOfDay} />
          <TopSendersTable senders={analytics.topSenders} />
        </div>

        {/* AI Impact Section */}
        {analytics.aiImpact && (
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="h-6 w-6 text-purple-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                AI Assistant Impact
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Time Saved
                </p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                  {Math.round(analytics.aiImpact.timeSavedMinutes / 60)}h{' '}
                  {analytics.aiImpact.timeSavedMinutes % 60}m
                </p>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI Actions Performed
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {analytics.aiImpact.actionsPerformed}
                </p>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Emails Auto-Categorized
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {analytics.aiImpact.emailsCategorized}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
          Analytics updated in real-time • Last updated:{' '}
          {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
}

function formatResponseTime(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return `${hours}h ${remainingMinutes}m`;
}
