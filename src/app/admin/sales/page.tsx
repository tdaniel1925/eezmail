'use client';

/**
 * Sales Dashboard Page
 * Track revenue, conversions, and sales performance
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { InlineNotification } from '@/components/ui/inline-notification';
import { Button } from '@/components/ui/button';

type SalesStats = {
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  conversionRate: number;
  revenueGrowth: number;
};

export default function SalesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<SalesStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
    conversionRate: 0,
    revenueGrowth: 0,
  });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const fetchSalesData = async () => {
    setRefreshing(true);
    setNotification(null);
    try {
      const response = await fetch('/api/admin/subscriptions');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        if (response.status === 403) {
          router.push('/dashboard');
          return;
        }
        throw new Error('Failed to fetch sales data');
      }
      const data = await response.json();

      // Calculate stats from subscriptions
      const activeSubscriptions =
        data.subscriptions?.filter(
          (sub: any) => sub.status === 'active' || sub.status === 'trialing'
        ) || [];

      const totalRevenue = activeSubscriptions.reduce(
        (sum: number, sub: any) => sum + parseFloat(sub.monthlyAmount || '0'),
        0
      );

      setStats({
        totalRevenue: totalRevenue,
        monthlyRevenue: totalRevenue, // MRR
        activeSubscriptions: activeSubscriptions.length,
        conversionRate: 0, // TODO: Calculate from trials to paid
        revenueGrowth: 0, // TODO: Calculate month-over-month growth
      });
    } catch (error: any) {
      console.error('Error fetching sales data:', error);
      setNotification({
        type: 'error',
        message: error.message || 'Failed to load sales data',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
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
          <div>
            <h1 className="text-3xl font-bold text-white">Sales Dashboard</h1>
            <p className="text-gray-400">
              Track revenue, conversions, and sales performance
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSalesData}
            disabled={refreshing}
            className="border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* Sales Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-3xl font-bold text-green-400">
                {loading ? '-' : `$${stats.totalRevenue.toFixed(2)}`}
              </div>
              <p className="text-xs text-gray-400 mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
              <CardTitle className="text-sm font-medium text-gray-400">
                Monthly Revenue
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-3xl font-bold text-blue-400">
                {loading ? '-' : `$${stats.monthlyRevenue.toFixed(2)}`}
              </div>
              <p className="text-xs text-gray-400 mt-1">MRR</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
              <CardTitle className="text-sm font-medium text-gray-400">
                Active Subscriptions
              </CardTitle>
              <CreditCard className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-3xl font-bold text-purple-400">
                {loading ? '-' : stats.activeSubscriptions}
              </div>
              <p className="text-xs text-gray-400 mt-1">Paying customers</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
              <CardTitle className="text-sm font-medium text-gray-400">
                Avg Customer Value
              </CardTitle>
              <Users className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-3xl font-bold text-orange-400">
                {loading
                  ? '-'
                  : stats.activeSubscriptions > 0
                    ? `$${(stats.monthlyRevenue / stats.activeSubscriptions).toFixed(2)}`
                    : '$0.00'}
              </div>
              <p className="text-xs text-gray-400 mt-1">Per customer</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Breakdown */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-400">
                Loading revenue data...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-700">
                  <div>
                    <p className="text-sm font-medium text-gray-300">
                      Monthly Recurring Revenue
                    </p>
                    <p className="text-xs text-gray-400">
                      Total active subscriptions
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    ${stats.monthlyRevenue.toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-slate-700">
                  <div>
                    <p className="text-sm font-medium text-gray-300">
                      Active Customers
                    </p>
                    <p className="text-xs text-gray-400">
                      Paying subscriptions
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-blue-400">
                    {stats.activeSubscriptions}
                  </div>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-300">
                      Average Revenue Per User
                    </p>
                    <p className="text-xs text-gray-400">ARPU</p>
                  </div>
                  <div className="text-2xl font-bold text-purple-400">
                    $
                    {stats.activeSubscriptions > 0
                      ? (
                          stats.monthlyRevenue / stats.activeSubscriptions
                        ).toFixed(2)
                      : '0.00'}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Growth Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Revenue Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Revenue growth chart coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Customer Acquisition</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Customer acquisition chart coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Note */}
        <Card className="border-slate-700 bg-blue-500/10 border-blue-500/20">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-300">
              <strong className="text-blue-400">Note:</strong> Sales metrics are
              calculated from active and trialing subscriptions. Historical
              charts and trends will be available once sufficient data has been
              collected.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
