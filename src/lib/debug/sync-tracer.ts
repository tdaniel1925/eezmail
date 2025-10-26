/**
 * Sync Job Tracer
 * Track and debug email synchronization jobs
 */

import { db } from '@/db';
import { syncJobs, auditLogs, emailAccounts } from '@/db/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';

export interface SyncJobDetail {
  id: string;
  accountId: string;
  accountEmail: string;
  provider: string;
  userId: string;
  jobType: string;
  status: string;
  priority: number;
  progress: number;
  total: number;
  duration: number | null;
  scheduledFor: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
  retryCount: number;
  maxRetries: number;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncJobTimeline {
  timestamp: Date;
  event: string;
  details: string;
  actor: string;
  metadata?: Record<string, unknown>;
}

export interface SyncJobStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageDuration: number;
  messagesProcessed: number;
  errorRate: number;
}

/**
 * Get all sync jobs with filters
 */
export async function getSyncJobs(filters: {
  status?: string;
  accountId?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ jobs: SyncJobDetail[]; total: number }> {
  const { status, accountId, userId, limit = 50, offset = 0 } = filters;

  const conditions = [];
  if (status) conditions.push(eq(syncJobs.status, status as any));
  if (accountId) conditions.push(eq(syncJobs.accountId, accountId));
  if (userId) conditions.push(eq(syncJobs.userId, userId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get jobs with account details
  const jobs = await db
    .select({
      id: syncJobs.id,
      accountId: syncJobs.accountId,
      accountEmail: emailAccounts.email,
      provider: emailAccounts.provider,
      userId: syncJobs.userId,
      jobType: syncJobs.jobType,
      status: syncJobs.status,
      priority: syncJobs.priority,
      progress: syncJobs.progress,
      total: syncJobs.total,
      scheduledFor: syncJobs.scheduledFor,
      startedAt: syncJobs.startedAt,
      completedAt: syncJobs.completedAt,
      errorMessage: syncJobs.errorMessage,
      retryCount: syncJobs.retryCount,
      maxRetries: syncJobs.maxRetries,
      metadata: syncJobs.metadata,
      createdAt: syncJobs.createdAt,
      updatedAt: syncJobs.updatedAt,
    })
    .from(syncJobs)
    .leftJoin(emailAccounts, eq(syncJobs.accountId, emailAccounts.id))
    .where(whereClause)
    .orderBy(desc(syncJobs.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(syncJobs)
    .where(whereClause);

  // Calculate durations
  const jobsWithDuration: SyncJobDetail[] = jobs.map((job) => {
    let duration: number | null = null;
    if (job.startedAt && job.completedAt) {
      duration =
        new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime();
    }

    return {
      ...job,
      accountEmail: job.accountEmail || 'Unknown',
      provider: job.provider || 'Unknown',
      duration,
    };
  });

  return {
    jobs: jobsWithDuration,
    total: count,
  };
}

/**
 * Get detailed timeline for a specific sync job
 */
export async function getSyncJobTimeline(
  jobId: string
): Promise<SyncJobTimeline[]> {
  // Get audit logs related to this sync job
  const logs = await db
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.resourceType, 'sync_job'),
        eq(auditLogs.resourceId, jobId)
      )
    )
    .orderBy(auditLogs.createdAt);

  return logs.map((log) => ({
    timestamp: new Date(log.createdAt),
    event: log.action,
    details: log.metadata
      ? JSON.stringify(log.metadata, null, 2)
      : 'No details',
    actor: log.actorType,
    metadata: log.metadata as Record<string, unknown> | undefined,
  }));
}

/**
 * Get sync job statistics
 */
export async function getSyncJobStats(filters: {
  accountId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<SyncJobStats> {
  const { accountId, userId, startDate, endDate } = filters;

  const conditions = [];
  if (accountId) conditions.push(eq(syncJobs.accountId, accountId));
  if (userId) conditions.push(eq(syncJobs.userId, userId));
  if (startDate) conditions.push(gte(syncJobs.createdAt, startDate));
  if (endDate) conditions.push(lte(syncJobs.createdAt, endDate));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get aggregate stats
  const [stats] = await db
    .select({
      totalJobs: sql<number>`count(*)::int`,
      activeJobs: sql<number>`count(*) FILTER (WHERE status IN ('pending', 'running'))::int`,
      completedJobs: sql<number>`count(*) FILTER (WHERE status = 'completed')::int`,
      failedJobs: sql<number>`count(*) FILTER (WHERE status = 'failed')::int`,
      averageDuration: sql<number>`COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - started_at))), 0)::int`,
      messagesProcessed: sql<number>`COALESCE(SUM(total), 0)::int`,
    })
    .from(syncJobs)
    .where(whereClause);

  const errorRate =
    stats.totalJobs > 0
      ? Math.round((stats.failedJobs / stats.totalJobs) * 100)
      : 0;

  return {
    totalJobs: stats.totalJobs,
    activeJobs: stats.activeJobs,
    completedJobs: stats.completedJobs,
    failedJobs: stats.failedJobs,
    averageDuration: Math.round(stats.averageDuration),
    messagesProcessed: stats.messagesProcessed,
    errorRate,
  };
}

/**
 * Get a single sync job by ID
 */
export async function getSyncJobById(
  jobId: string
): Promise<SyncJobDetail | null> {
  const [job] = await db
    .select({
      id: syncJobs.id,
      accountId: syncJobs.accountId,
      accountEmail: emailAccounts.email,
      provider: emailAccounts.provider,
      userId: syncJobs.userId,
      jobType: syncJobs.jobType,
      status: syncJobs.status,
      priority: syncJobs.priority,
      progress: syncJobs.progress,
      total: syncJobs.total,
      scheduledFor: syncJobs.scheduledFor,
      startedAt: syncJobs.startedAt,
      completedAt: syncJobs.completedAt,
      errorMessage: syncJobs.errorMessage,
      retryCount: syncJobs.retryCount,
      maxRetries: syncJobs.maxRetries,
      metadata: syncJobs.metadata,
      createdAt: syncJobs.createdAt,
      updatedAt: syncJobs.updatedAt,
    })
    .from(syncJobs)
    .leftJoin(emailAccounts, eq(syncJobs.accountId, emailAccounts.id))
    .where(eq(syncJobs.id, jobId))
    .limit(1);

  if (!job) return null;

  let duration: number | null = null;
  if (job.startedAt && job.completedAt) {
    duration =
      new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime();
  }

  return {
    ...job,
    accountEmail: job.accountEmail || 'Unknown',
    provider: job.provider || 'Unknown',
    duration,
  };
}
