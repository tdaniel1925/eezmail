import { getDashboardStats, getRevenueData } from '@/lib/admin/stats';
import { SalesMetrics } from '@/components/admin/SalesMetrics';
import { RevenueBreakdown } from '@/components/admin/RevenueBreakdown';
import { TopCustomers } from '@/components/admin/TopCustomers';

// Force dynamic rendering for admin pages that require auth
export const dynamic = 'force-dynamic';

export default async function AdminSalesPage() {
  const [statsResult, revenueResult] = await Promise.all([
    getDashboardStats(),
    getRevenueData(),
  ]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Sales Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Track revenue, conversions, and sales performance
        </p>
      </div>

      {/* Sales Metrics */}
      {statsResult.success && statsResult.stats && (
        <SalesMetrics stats={statsResult.stats} />
      )}

      {/* Revenue Breakdown */}
      {revenueResult.success && revenueResult.data && (
        <RevenueBreakdown data={revenueResult.data} />
      )}

      {/* Top Customers */}
      <TopCustomers />
    </div>
  );
}
