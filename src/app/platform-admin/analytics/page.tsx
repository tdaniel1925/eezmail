import { redirect } from 'next/navigation';
import { requirePlatformAdmin } from '@/lib/admin/platform-middleware';
import {
  getRevenueAnalytics,
  getTopCustomersByUsage,
  getChurnAnalytics,
  getUsageTrends,
} from '@/lib/admin/analytics-actions';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  MessageSquare,
  Brain,
  Users,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import RevenueChart from '@/components/admin/RevenueChart';
import TopCustomersTable from '@/components/admin/TopCustomersTable';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const admin = await requirePlatformAdmin();

  if (!admin) {
    redirect('/dashboard');
  }

  // Get last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const [revenueResult, topCustomersResult, churnResult, trendsResult] =
    await Promise.all([
      getRevenueAnalytics(startDate, endDate),
      getTopCustomersByUsage(10),
      getChurnAnalysis(),
      getUsageTrends(30),
    ]);

  const revenue = revenueResult.success ? revenueResult.data : null;
  const topCustomers = topCustomersResult.success
    ? topCustomersResult.data
    : [];
  const churn = churnResult.success ? churnResult.data : null;
  const trends = trendsResult.success ? trendsResult.data : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/platform-admin">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 p-3">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Analytics Dashboard
              </h1>
              <p className="text-slate-600">
                Revenue, usage, and customer insights (Last 30 Days)
              </p>
            </div>
          </div>
        </div>

        {/* Growth Metrics */}
        {trends && (
          <div className="grid gap-6 md:grid-cols-4 mb-8">
            <Card className="border-2 border-slate-200 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  SMS Growth
                </CardTitle>
                {trends.smsGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div
                  className={`text-3xl font-bold ${
                    trends.smsGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {trends.smsGrowth >= 0 ? '+' : ''}
                  {trends.smsGrowth.toFixed(1)}%
                </div>
                <p className="text-xs text-slate-500 mt-1">vs. previous 30d</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  AI Growth
                </CardTitle>
                {trends.aiGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div
                  className={`text-3xl font-bold ${
                    trends.aiGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {trends.aiGrowth >= 0 ? '+' : ''}
                  {trends.aiGrowth.toFixed(1)}%
                </div>
                <p className="text-xs text-slate-500 mt-1">vs. previous 30d</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Revenue Growth
                </CardTitle>
                {trends.revenueGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div
                  className={`text-3xl font-bold ${
                    trends.revenueGrowth >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {trends.revenueGrowth >= 0 ? '+' : ''}
                  {trends.revenueGrowth.toFixed(1)}%
                </div>
                <p className="text-xs text-slate-500 mt-1">vs. previous 30d</p>
              </CardContent>
            </Card>

            <Card
              className={`border-2 shadow-lg ${
                churn && churn.churnRate > 20
                  ? 'border-red-200 bg-red-50'
                  : 'border-slate-200'
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Churn Rate
                </CardTitle>
                <AlertTriangle
                  className={`h-4 w-4 ${
                    churn && churn.churnRate > 20
                      ? 'text-red-600'
                      : 'text-slate-400'
                  }`}
                />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-3xl font-bold ${
                    churn && churn.churnRate > 20
                      ? 'text-red-600'
                      : 'text-slate-900'
                  }`}
                >
                  {churn?.churnRate.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {churn?.inactiveCustomers || 0} inactive customers
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Revenue Breakdown */}
        {revenue && (
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="border-2 border-green-200 bg-green-50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <DollarSign className="h-5 w-5" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-900">
                  ${revenue.totals.totalRevenue.toFixed(2)}
                </div>
                <p className="text-sm text-green-700 mt-2">Last 30 days</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 bg-blue-50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <MessageSquare className="h-5 w-5" />
                  SMS Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-blue-900">
                  ${revenue.totals.smsRevenue.toFixed(2)}
                </div>
                <p className="text-sm text-blue-700 mt-2">
                  {revenue.totals.totalRevenue > 0
                    ? (
                        (revenue.totals.smsRevenue /
                          revenue.totals.totalRevenue) *
                        100
                      ).toFixed(0)
                    : 0}
                  % of total
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-200 bg-purple-50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <Brain className="h-5 w-5" />
                  AI Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-purple-900">
                  ${revenue.totals.aiRevenue.toFixed(2)}
                </div>
                <p className="text-sm text-purple-700 mt-2">
                  {revenue.totals.totalRevenue > 0
                    ? (
                        (revenue.totals.aiRevenue /
                          revenue.totals.totalRevenue) *
                        100
                      ).toFixed(0)
                    : 0}
                  % of total
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Revenue Chart */}
        {revenue && (
          <Card className="border-2 border-slate-200 shadow-lg mb-8">
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={revenue.daily} />
            </CardContent>
          </Card>
        )}

        {/* Top Customers */}
        {topCustomers && topCustomers.length > 0 && (
          <Card className="border-2 border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Top Customers by Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TopCustomersTable customers={topCustomers} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

