/**
 * Email Accounts Management Dashboard
 * Monitor all email accounts across all users
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin/auth';
import { db } from '@/db';
import { emailAccounts, users } from '@/db/schema';
import { desc, sql, eq } from 'drizzle-orm';
import { EmailAccountsTable } from '@/components/admin/EmailAccountsTable';
import { EmailAccountStats } from '@/components/admin/EmailAccountStats';
import { Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function EmailAccountsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin using proper auth helper
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    redirect('/dashboard');
  }

  // Get all email accounts with user info
  const accounts = await db
    .select({
      account: emailAccounts,
      user: users,
    })
    .from(emailAccounts)
    .leftJoin(users, eq(emailAccounts.userId, users.id))
    .orderBy(desc(emailAccounts.lastSyncAt));

  // Calculate statistics
  const stats = {
    total: accounts.length,
    active: accounts.filter(
      (a) => a.account.status === 'connected' || a.account.status === 'syncing'
    ).length,
    errors: accounts.filter((a) => a.account.status === 'error').length,
    syncing: accounts.filter((a) => a.account.status === 'syncing').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Email Accounts
              </h1>
              <p className="text-sm text-gray-500">
                Monitor and manage all email accounts
              </p>
            </div>
          </div>

          <Button
            onClick={() => window.location.reload()}
            className="gap-2"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Statistics */}
        <EmailAccountStats stats={stats} />

        {/* Email Accounts Table */}
        <Suspense fallback={<div>Loading accounts...</div>}>
          <EmailAccountsTable accounts={accounts} />
        </Suspense>
      </div>
    </div>
  );
}
