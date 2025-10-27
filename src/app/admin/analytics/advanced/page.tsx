'use client';

/**
 * Advanced Analytics Page
 * Deep dive into user behavior and business metrics
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { InlineNotification } from '@/components/ui/inline-notification';

export default function AdvancedAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    avgRevenue: 0,
    engagementRate: 0,
  });

  useEffect(() => {
    async function loadAnalytics() {
      try {
        console.log('[Analytics Page] Fetching analytics...');
        const response = await fetch('/api/admin/analytics');
        console.log('[Analytics Page] Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('[Analytics Page] Error response:', errorData);

          if (response.status === 401) {
            router.push('/login');
            return;
          }
          if (response.status === 403) {
            router.push('/dashboard');
            return;
          }
          throw new Error(
            errorData.details || errorData.error || 'Failed to load analytics'
          );
        }

        const data = await response.json();
        console.log('[Analytics Page] Data received:', data);

        if (data.stats) {
          setStats(data.stats);
          console.log('[Analytics Page] Stats set successfully:', data.stats);
        } else {
          console.warn('[Analytics Page] No stats in response');
          setNotification({
            type: 'info',
            message: 'No analytics data available yet',
          });
        }
      } catch (error) {
        console.error('[Analytics Page] Error loading analytics:', error);
        setNotification({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to load analytics data',
        });
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Notification */}
        {notification && (
          <InlineNotification
            type={notification.type}
            message={notification.message}
            onDismiss={() => setNotification(null)}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-3 border border-blue-500/20">
              <BarChart3 className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Advanced Analytics
              </h1>
              <p className="text-sm text-gray-400">
                Deep dive into user behavior and business metrics
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {loading ? '-' : stats.totalUsers.toLocaleString()}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                All time registered users
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Active Users
              </CardTitle>
              <Activity className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">
                {loading ? '-' : stats.activeUsers.toLocaleString()}
              </div>
              <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Avg Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">
                ${loading ? '-' : stats.avgRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-gray-400 mt-1">Per user per month</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Engagement Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">
                {loading ? '-' : stats.engagementRate.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-400 mt-1">Daily active users</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Content */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* User Growth */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>User growth chart coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Trends */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Revenue trends chart coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Metrics */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Engagement Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Engagement metrics coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cohort Analysis */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Cohort Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Cohort analysis coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Note */}
        <Card className="border-slate-700 bg-blue-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-300">
              <strong className="text-blue-400">Note:</strong> Advanced
              analytics features require historical data collection. Charts and
              detailed insights will be available once sufficient data has been
              accumulated.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
