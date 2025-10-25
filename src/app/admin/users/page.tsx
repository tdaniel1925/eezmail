import { getUsers } from '@/lib/admin/users';
import { UserManagementTable } from '@/components/admin/UserManagementTable';

// Force dynamic rendering for admin pages that require auth
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: {
    page?: string;
    search?: string;
    tier?: string;
    status?: string;
  };
}) {
  const page = parseInt(searchParams.page || '1');
  const search = searchParams.search;
  const tier = searchParams.tier;
  const status = searchParams.status;

  const result = await getUsers({ page, search, tier, status });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          User Management
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Manage all users and their subscriptions
        </p>
      </div>

      {/* User Table */}
      {result.success && result.users && (
        <UserManagementTable
          users={result.users}
          total={result.total || 0}
          page={result.page || 1}
          totalPages={result.totalPages || 1}
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
