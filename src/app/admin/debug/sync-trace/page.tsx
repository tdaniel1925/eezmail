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
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Sync Job Tracer</h1>
        <p className="text-muted-foreground">
          Track and debug email synchronization jobs across all providers
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <SyncJobsContent />
      </Suspense>
    </div>
  );
}
