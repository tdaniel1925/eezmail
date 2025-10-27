import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSyncJobs, getSyncJobStats } from '@/lib/debug/sync-tracer';
import { SyncJobsList } from '@/components/admin/debug/SyncJobsList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from 'lucide-react';

export const metadata = {
  title: 'Sync Job Tracer - Admin Debug',
  description: 'Track and debug email synchronization jobs',
};

async function SyncJobsContent(): Promise<JSX.Element> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check admin role (you should implement proper role checking)
  // For now, assuming all authenticated users can access

  // Fetch sync jobs
  console.log('[SyncTracePage] Fetching sync jobs with filters:', {
    limit: 50,
    offset: 0,
  });
  const { jobs, total } = await getSyncJobs({ limit: 50, offset: 0 });
  console.log('[SyncTracePage] Got jobs:', jobs?.length || 0, 'total:', total);

  // Fetch stats
  console.log('[SyncTracePage] Fetching sync job stats with filters:', {});
  const stats = await getSyncJobStats({});
  console.log('[SyncTracePage] Got stats:', stats);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeJobs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedJobs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedJobs}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.errorRate}% error rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(stats.averageDuration / 1000)}s
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.messagesProcessed.toLocaleString()} messages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <SyncJobsList initialJobs={jobs} initialTotal={total} />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function SyncTracePage(): Promise<JSX.Element> {
  return (
    <div className="container mx-auto py-8">
      {/* Page Header with Explanation */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Sync Job Tracer
        </h1>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-200 mb-3">
            <strong>📊 What is this page for?</strong>
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
            This page monitors all email synchronization jobs running in the
            background across Gmail, Microsoft, and IMAP accounts. Each time the
            system fetches new emails, it creates a "sync job" tracked here.
          </p>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>
              <strong>Active:</strong> Jobs currently running and fetching
              emails
            </li>
            <li>
              <strong>Completed:</strong> Successfully finished sync operations
            </li>
            <li>
              <strong>Failed:</strong> Jobs that encountered errors (check
              details for troubleshooting)
            </li>
            <li>
              <strong>Progress:</strong> Real-time view of how many emails have
              been processed
            </li>
            <li>
              <strong>Duration:</strong> How long each sync operation takes
              (helps identify slow accounts)
            </li>
          </ul>
          <p className="text-sm text-blue-800 dark:text-blue-300 mt-3">
            💡 <strong>Use this to:</strong> Debug sync issues, monitor
            performance, identify stuck jobs, and track which accounts sync most
            frequently.
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Loading sync jobs...
            </span>
          </div>
        }
      >
        <SyncJobsContent />
      </Suspense>
    </div>
  );
}
