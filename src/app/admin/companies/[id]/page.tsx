/**
 * Admin Company Detail Page
 * View and manage individual sandbox company
 */

import { redirect } from 'next/navigation';
import { getAuthenticatedUser, isAdmin } from '@/lib/auth/admin-auth';
import { db } from '@/lib/db';
import { sandboxCompanies, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const metadata = {
  title: 'Company Details | Admin | EaseMail',
  description: 'Manage sandbox company',
};

export default async function CompanyDetailPage({
  params,
}: {
  params: { id: string };
}): Promise<JSX.Element> {
  // Check authentication and admin status
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (!isAdmin(user.role)) {
    redirect('/dashboard');
  }

  // Fetch company details
  const company = await db.query.sandboxCompanies.findFirst({
    where: eq(sandboxCompanies.id, params.id),
  });

  if (!company) {
    redirect('/admin');
  }

  // Fetch company users
  const companyUsers = await db.query.users.findMany({
    where: eq(users.sandboxCompanyId, params.id),
    columns: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      smsSentCount: true,
      aiTokensUsed: true,
      createdAt: true,
    },
    orderBy: (users, { desc }) => [desc(users.createdAt)],
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/admin"
            className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            ← Back to Admin Dashboard
          </a>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {company.name}
          </h1>
          {company.description && (
            <p className="mt-2 text-gray-600 dark:text-gray-400">{company.description}</p>
          )}
        </div>

        {/* Company Info */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h3 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              Status
            </h3>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {company.status}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h3 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Users
            </h3>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {companyUsers.length}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h3 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              SMS Used
            </h3>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {company.totalSmsUsed.toLocaleString()}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h3 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              AI Tokens Used
            </h3>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {company.totalAiTokensUsed.toLocaleString()}
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
            <h3 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              Created
            </h3>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {new Date(company.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-lg bg-white shadow dark:bg-gray-800">
          <div className="border-b border-gray-200 p-6 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Sandbox Users
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Full Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    SMS Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    AI Tokens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {companyUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No users in this company yet
                    </td>
                  </tr>
                ) : (
                  companyUsers.map((companyUser) => (
                    <tr key={companyUser.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {companyUser.email}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {companyUser.fullName || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {companyUser.smsSentCount.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {companyUser.aiTokensUsed.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(companyUser.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

