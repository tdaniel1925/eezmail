import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is admin
  const isAdminUser = await isAdmin();

  if (!isAdminUser) {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

