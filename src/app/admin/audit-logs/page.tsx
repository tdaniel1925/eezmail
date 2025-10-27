/**
 * Audit Logs Admin Page
 * HIPAA-compliant audit log viewer with advanced filtering
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin/auth';
import { getAuditLogs, getAuditStatistics } from '@/lib/audit/logger';
import { AuditLogsTable } from '@/components/admin/AuditLogsTable';
import { AuditLogsFilters } from '@/components/admin/AuditLogsFilters';
import { AuditStatsCards } from '@/components/admin/AuditStatsCards';
import { Button } from '@/components/ui/button';
import { Download, Shield } from 'lucide-react';

interface AuditLogsPageProps {
  searchParams: Promise<{
    page?: string;
    action?: string;
    resourceType?: string;
    riskLevel?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }>;
}

export default async function AuditLogsPage({
  searchParams,
}: AuditLogsPageProps) {
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

  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const filter = {
    action: params.action,
    resourceType: params.resourceType,
    riskLevel: params.riskLevel,
    startDate: params.startDate ? new Date(params.startDate) : undefined,
    endDate: params.endDate ? new Date(params.endDate) : undefined,
    search: params.search,
    page,
    limit: 50,
  };

  const { logs, total } = await getAuditLogs(filter);

  // Get statistics for last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const stats = await getAuditStatistics(startDate, endDate);

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
              <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
              <p className="text-sm text-gray-500">
                HIPAA-compliant activity monitoring
              </p>
            </div>
          </div>

          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Logs
          </Button>
        </div>

        {/* Statistics Cards */}
        <AuditStatsCards stats={stats} />

        {/* Filters */}
        <AuditLogsFilters initialFilter={filter} />

        {/* Audit Logs Table */}
        <Suspense
          fallback={
            <div className="rounded-lg border bg-white p-8 text-center">
              <div className="animate-pulse">Loading audit logs...</div>
            </div>
          }
        >
          <AuditLogsTable logs={logs} total={total} currentPage={page} />
        </Suspense>
      </div>
    </div>
  );
}
