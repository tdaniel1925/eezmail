import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getSyncJobById, getSyncJobTimeline } from '@/lib/debug/sync-tracer';
import { SyncJobTimeline } from '@/components/admin/debug/SyncJobTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Server, User, Calendar } from 'lucide-react';

interface PageProps {
  params: Promise<{
    jobId: string;
  }>;
}

async function SyncJobDetailContent({
  jobId,
}: {
  jobId: string;
}): Promise<JSX.Element> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch job details
  const job = await getSyncJobById(jobId);
  if (!job) {
    notFound();
  }

  // Fetch timeline
  const timeline = await getSyncJobTimeline(jobId);

  const formatDuration = (ms: number | null): string => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Job Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sync Job Overview</CardTitle>
            <Badge
              variant={
                job.status === 'completed'
                  ? 'default'
                  : job.status === 'failed'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {job.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Account:</span>
                <span>{job.accountEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Provider:</span>
                <Badge variant="outline">{job.provider}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Duration:</span>
                <span>{formatDuration(job.duration)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Created:</span>
                <span>{new Date(job.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Job Type:</span>{' '}
                <Badge variant="outline">{job.jobType}</Badge>
              </div>
              <div className="text-sm">
                <span className="font-medium">Priority:</span> {job.priority}
              </div>
              <div className="text-sm">
                <span className="font-medium">Retry Count:</span>{' '}
                {job.retryCount} / {job.maxRetries}
              </div>
              {job.total > 0 && (
                <div className="text-sm">
                  <span className="font-medium">Progress:</span> {job.progress}{' '}
                  / {job.total} messages
                  <div className="mt-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{
                        width: `${(job.progress / job.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {job.errorMessage && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm font-medium text-destructive mb-1">
                Error Message:
              </p>
              <pre className="text-xs text-destructive whitespace-pre-wrap">
                {job.errorMessage}
              </pre>
            </div>
          )}

          {job.metadata && Object.keys(job.metadata).length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Metadata:</p>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                {JSON.stringify(job.metadata, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Job Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <SyncJobTimeline events={timeline} />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function SyncJobDetailPage({
  params,
}: PageProps): Promise<JSX.Element> {
  const { jobId } = await params;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/admin/debug/sync-trace">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>Back to Sync Jobs</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Sync Job Details</h1>
        <p className="text-muted-foreground">Job ID: {jobId}</p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <SyncJobDetailContent jobId={jobId} />
      </Suspense>
    </div>
  );
}
