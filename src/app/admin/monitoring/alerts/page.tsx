/**
 * Alert Rules Configuration Page
 * Create and manage alert rules visually
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { alertRules } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { AlertRulesTable } from '@/components/admin/AlertRulesTable';
import { Button } from '@/components/ui/button';
import { Plus, Shield } from 'lucide-react';
import Link from 'next/link';

export default async function AlertRulesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'super_admin' && userData?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Get all alert rules
  const rules = await db
    .select()
    .from(alertRules)
    .orderBy(desc(alertRules.createdAt));

  const stats = {
    total: rules.length,
    enabled: rules.filter((r) => r.enabled).length,
    critical: rules.filter((r) => r.severity === 'critical').length,
    triggered: rules.filter((r) => r.lastTriggeredAt !== null).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Alert Rules</h1>
              <p className="text-sm text-gray-500">
                Configure automated alerting thresholds
              </p>
            </div>
          </div>

          <Link href="/admin/monitoring/alerts/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Rule
            </Button>
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-lg border bg-white p-6">
            <p className="text-sm text-gray-500">Total Rules</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.total}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <p className="text-sm text-gray-500">Enabled</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {stats.enabled}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <p className="text-sm text-gray-500">Critical Level</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {stats.critical}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <p className="text-sm text-gray-500">Recently Triggered</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {stats.triggered}
            </p>
          </div>
        </div>

        {/* Alert Rules Table */}
        <Suspense fallback={<div>Loading rules...</div>}>
          <AlertRulesTable rules={rules} />
        </Suspense>
      </div>
    </div>
  );
}
