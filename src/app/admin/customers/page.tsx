import { getUsers } from '@/lib/admin/users';
import { CustomerManagementTable } from '@/components/admin/CustomerManagementTable';

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; tier?: string };
}) {
  const page = parseInt(searchParams.page || '1');
  const search = searchParams.search;
  const tier = searchParams.tier;

  // Only show paying customers (exclude free tier)
  const result = await getUsers({ 
    page, 
    search, 
    tier: tier || undefined,
  });

  // Filter to paying customers only
  const payingCustomers = result.users?.filter(u => u.tier !== 'free') || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Customer Management
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Manage paying customers and subscriptions
        </p>
      </div>

      {/* Customer Table */}
      {result.success && (
        <CustomerManagementTable
          customers={payingCustomers}
          total={payingCustomers.length}
          page={result.page || 1}
          totalPages={Math.ceil(payingCustomers.length / 20)}
        />
      )}

      {!result.success && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{result.error}</p>
        </div>
      )}
    </div>
  );
}

