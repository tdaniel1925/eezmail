/**
 * Admin Dashboard Page
 * Manage sandbox companies and users (admin-only)
 */

import { redirect } from 'next/navigation';
import { getAuthenticatedUser, isAdmin } from '@/lib/auth/admin-auth';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export const metadata = {
  title: 'Admin Dashboard | EaseMail',
  description: 'Manage sandbox companies and users',
};

export default async function AdminPage(): Promise<JSX.Element> {
  // Check authentication and admin status
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (!isAdmin(user.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminDashboard user={user} />
    </div>
  );
}
