import { redirect } from 'next/navigation';
import { requirePlatformAdmin } from '@/lib/admin/platform-middleware';
import { getPlatformStats } from '@/lib/admin/platform-actions';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Brain,
  Gift,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function PlatformAdminPage() {
  const admin = await requirePlatformAdmin();

  if (!admin) {
    redirect('/dashboard');
  }

  const statsResult = await getPlatformStats();
  const stats = statsResult.success ? statsResult.stats : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 p-3">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Platform Admin Dashboard
              </h1>
              <p className="text-slate-600">
                Welcome back, {admin.user.email} • Role: {admin.adminRole}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Customers */}
          <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Customers
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {stats?.totalCustomers || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {stats?.totalOrganizations || 0} orgs •{' '}
                {stats?.totalIndividuals || 0} individuals
              </p>
            </CardContent>
          </Card>

          {/* SMS Sent */}
          <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                SMS Sent
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {stats?.smsSentThisMonth.toLocaleString() || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {stats?.smsSentToday || 0} today • This month
              </p>
            </CardContent>
          </Card>

          {/* AI Tokens */}
          <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                AI Tokens Used
              </CardTitle>
              <Brain className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {Math.round((stats?.aiTokensThisMonth || 0) / 1000)}k
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {Math.round((stats?.aiTokensToday || 0) / 1000)}k today • This
                month
              </p>
            </CardContent>
          </Card>

          {/* Revenue */}
          <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                ${stats?.totalRevenue.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-slate-500 mt-1">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <a
            href="/platform-admin/customers"
            className="group block p-6 bg-white rounded-xl border-2 border-slate-200 shadow-lg hover:shadow-xl hover:border-primary/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-blue-100 p-3 group-hover:bg-blue-200 transition-colors">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                  Manage Customers
                </h3>
                <p className="text-sm text-slate-600">
                  View and manage all customers
                </p>
              </div>
            </div>
          </a>

          <a
            href="/platform-admin/pricing"
            className="group block p-6 bg-white rounded-xl border-2 border-slate-200 shadow-lg hover:shadow-xl hover:border-primary/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-green-100 p-3 group-hover:bg-green-200 transition-colors">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                  Pricing Management
                </h3>
                <p className="text-sm text-slate-600">
                  Set custom rates and tiers
                </p>
              </div>
            </div>
          </a>

          <a
            href="/platform-admin/trials"
            className="group block p-6 bg-white rounded-xl border-2 border-slate-200 shadow-lg hover:shadow-xl hover:border-primary/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-purple-100 p-3 group-hover:bg-purple-200 transition-colors">
                <Gift className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                  Trial Credits
                </h3>
                <p className="text-sm text-slate-600">
                  Grant free SMS & AI credits
                </p>
              </div>
            </div>
          </a>
        </div>

        {/* Active Trials Alert */}
        {stats && stats.activeTrials > 0 && (
          <Card className="border-2 border-amber-200 bg-amber-50 shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <Zap className="h-5 w-5" />
                Active Trials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-800">
                <span className="font-bold text-2xl">{stats.activeTrials}</span>{' '}
                customers are currently on trial credits.
              </p>
              <a
                href="/platform-admin/trials"
                className="text-amber-900 underline hover:text-amber-700 text-sm mt-2 inline-block"
              >
                View all trials →
              </a>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

