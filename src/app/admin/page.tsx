import { getDashboardStats, getSubscriptionStats, getRevenueData, getRecentSignups } from '@/lib/admin/stats';
import { StatsOverview } from '@/components/admin/StatsOverview';
import { SubscriptionChart } from '@/components/admin/SubscriptionChart';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { RecentSignups } from '@/components/admin/RecentSignups';

export default async function AdminDashboardPage() {
  const [statsResult, subscriptionResult, revenueResult, signupsResult] = await Promise.all([
    getDashboardStats(),
    getSubscriptionStats(),
    getRevenueData(),
    getRecentSignups(),
  ]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Monitor your platform's performance and metrics
        </p>
      </div>

      {/* Stats Overview */}
      {statsResult.success && statsResult.stats && (
        <StatsOverview stats={statsResult.stats} />
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Distribution */}
        {subscriptionResult.success && subscriptionResult.stats && (
          <SubscriptionChart stats={subscriptionResult.stats} />
        )}

        {/* Revenue Chart */}
        {revenueResult.success && revenueResult.data && (
          <RevenueChart data={revenueResult.data} />
        )}
      </div>

      {/* Recent Signups */}
      {signupsResult.success && signupsResult.users && (
        <RecentSignups users={signupsResult.users} />
      )}
    </div>
  );
}

