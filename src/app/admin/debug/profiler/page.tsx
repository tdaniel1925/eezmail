import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPerformanceMetrics } from '@/lib/debug/profiler';
import { SlowQueriesTable } from '@/components/admin/debug/SlowQueriesTable';
import { APILatencyChart } from '@/components/admin/debug/APILatencyChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

export const metadata = {
  title: 'Performance Profiler - Admin Debug',
  description: 'Identify slow queries and performance bottlenecks',
};

async function ProfilerContent(): Promise<JSX.Element> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch performance metrics for last 24 hours
  const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const metrics = await getPerformanceMetrics({ startDate });

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Response Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.summary.avgResponseTime}ms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              P95 Response Time
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.summary.p95ResponseTime}ms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.summary.totalRequests.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.summary.errorRate}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Latency Chart */}
      <APILatencyChart data={metrics.recentLatency} />

      {/* Slow Queries */}
      <Card>
        <CardHeader>
          <CardTitle>Slow Queries (&gt;1 second)</CardTitle>
        </CardHeader>
        <CardContent>
          <SlowQueriesTable queries={metrics.slowQueries} />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function ProfilerPage(): Promise<JSX.Element> {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Performance Profiler</h1>
        <p className="text-muted-foreground">
          Identify slow queries and performance bottlenecks across your
          application
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <ProfilerContent />
      </Suspense>
    </div>
  );
}
