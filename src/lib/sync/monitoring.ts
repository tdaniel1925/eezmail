/**
 * Sync Monitoring & Metrics
 * Track sync performance, errors, and generate reports
 */

'use server';

import { db } from '@/lib/db';
import { emailAccounts, emails, syncJobs } from '@/db/schema';
import { eq, and, gte, desc, sql, count } from 'drizzle-orm';

export interface SyncMetrics {
  accountId: string;
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  totalEmailsSynced: number;
  averageSyncTime: number; // milliseconds
  lastSyncDuration?: number;
  errorRate: number; // percentage
  uptime: number; // percentage
}

export interface SystemMetrics {
  totalAccounts: number;
  activeAccounts: number;
  inactiveAccounts: number;
  syncingNow: number;
  totalEmails: number;
  emailsLast24h: number;
  averageEmailsPerDay: number;
  topActiveAccounts: Array<{
    accountId: string;
    emailAddress: string;
    emailCount: number;
  }>;
  recentErrors: Array<{
    accountId: string;
    emailAddress: string;
    error: string;
    occurredAt: Date;
  }>;
}

/**
 * Get metrics for a specific account
 */
export async function getAccountMetrics(
  accountId: string,
  periodDays: number = 30
): Promise<SyncMetrics> {
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - periodDays);

  // Get sync jobs for this account
  const jobs = await db
    .select()
    .from(syncJobs)
    .where(
      and(
        eq(syncJobs.accountId, accountId),
        gte(syncJobs.createdAt, periodStart)
      )
    );

  const totalSyncs = jobs.length;
  const successfulSyncs = jobs.filter((j) => j.status === 'completed').length;
  const failedSyncs = jobs.filter((j) => j.status === 'failed').length;

  // Calculate average sync time
  const completedJobs = jobs.filter((j) => j.startedAt && j.completedAt);
  const avgSyncTime =
    completedJobs.length > 0
      ? completedJobs.reduce((sum, job) => {
          const duration =
            new Date(job.completedAt!).getTime() -
            new Date(job.startedAt!).getTime();
          return sum + duration;
        }, 0) / completedJobs.length
      : 0;

  // Get last sync duration
  const lastCompleted = completedJobs.sort(
    (a, b) =>
      new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
  )[0];
  const lastSyncDuration = lastCompleted
    ? new Date(lastCompleted.completedAt!).getTime() -
      new Date(lastCompleted.startedAt!).getTime()
    : undefined;

  // Get total emails synced
  const [emailCount] = await db
    .select({ count: count() })
    .from(emails)
    .where(
      and(eq(emails.accountId, accountId), gte(emails.createdAt, periodStart))
    );

  const totalEmailsSynced = Number(emailCount?.count || 0);

  // Calculate error rate
  const errorRate = totalSyncs > 0 ? (failedSyncs / totalSyncs) * 100 : 0;

  // Calculate uptime (successful syncs / total syncs)
  const uptime = totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0;

  return {
    accountId,
    totalSyncs,
    successfulSyncs,
    failedSyncs,
    totalEmailsSynced,
    averageSyncTime: Math.round(avgSyncTime),
    lastSyncDuration: lastSyncDuration
      ? Math.round(lastSyncDuration)
      : undefined,
    errorRate: Math.round(errorRate * 100) / 100,
    uptime: Math.round(uptime * 100) / 100,
  };
}

/**
 * Get system-wide metrics
 */
export async function getSystemMetrics(
  userId?: string
): Promise<SystemMetrics> {
  // Build where clause for user filter
  const userFilter = userId ? eq(emailAccounts.userId, userId) : undefined;

  // Total accounts
  const [accountStats] = await db
    .select({
      total: count(),
      active: sql<number>`SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)`,
      inactive: sql<number>`SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END)`,
      syncing: sql<number>`SUM(CASE WHEN sync_status = 'syncing' THEN 1 ELSE 0 END)`,
    })
    .from(emailAccounts)
    .where(userFilter);

  // Total emails
  const emailQuery = db.select({ count: count() }).from(emails);
  if (userId) {
    const [emailCountResult] = await db
      .select({ count: count() })
      .from(emails)
      .innerJoin(emailAccounts, eq(emails.accountId, emailAccounts.id))
      .where(eq(emailAccounts.userId, userId));
    var totalEmails = Number(emailCountResult?.count || 0);
  } else {
    const [emailCountResult] = await emailQuery;
    var totalEmails = Number(emailCountResult?.count || 0);
  }

  // Emails in last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (userId) {
    const [recent24hResult] = await db
      .select({ count: count() })
      .from(emails)
      .innerJoin(emailAccounts, eq(emails.accountId, emailAccounts.id))
      .where(
        and(eq(emailAccounts.userId, userId), gte(emails.receivedAt, oneDayAgo))
      );
    var emailsLast24h = Number(recent24hResult?.count || 0);
  } else {
    const [recent24hResult] = await db
      .select({ count: count() })
      .from(emails)
      .where(gte(emails.receivedAt, oneDayAgo));
    var emailsLast24h = Number(recent24hResult?.count || 0);
  }

  // Top active accounts (by email count)
  const topAccountsQuery = sql<{
    accountId: string;
    emailAddress: string;
    emailCount: number;
  }>`
    SELECT 
      ea.id as "accountId",
      ea.email_address as "emailAddress",
      COUNT(e.id) as "emailCount"
    FROM email_accounts ea
    LEFT JOIN emails e ON e.account_id = ea.id
    ${userFilter ? sql`WHERE ea.user_id = ${userId}` : sql``}
    GROUP BY ea.id, ea.email_address
    ORDER BY "emailCount" DESC
    LIMIT 5
  `;
  const topAccounts = await db.execute(topAccountsQuery);

  // Recent errors
  const recentErrorsQuery = sql<{
    accountId: string;
    emailAddress: string;
    error: string;
    occurredAt: Date;
  }>`
    SELECT 
      ea.id as "accountId",
      ea.email_address as "emailAddress",
      ea.last_sync_error as error,
      ea.last_sync_at as "occurredAt"
    FROM email_accounts ea
    WHERE ea.last_sync_error IS NOT NULL
    ${userFilter ? sql`AND ea.user_id = ${userId}` : sql``}
    ORDER BY ea.last_sync_at DESC
    LIMIT 10
  `;
  const recentErrors = await db.execute(recentErrorsQuery);

  return {
    totalAccounts: Number(accountStats?.total || 0),
    activeAccounts: Number(accountStats?.active || 0),
    inactiveAccounts: Number(accountStats?.inactive || 0),
    syncingNow: Number(accountStats?.syncing || 0),
    totalEmails,
    emailsLast24h,
    averageEmailsPerDay: Math.round(emailsLast24h), // Simplified
    topActiveAccounts: topAccounts.rows as any[],
    recentErrors: recentErrors.rows as any[],
  };
}

/**
 * Get sync history for account
 */
export async function getSyncHistory(accountId: string, limit: number = 20) {
  return await db
    .select()
    .from(syncJobs)
    .where(eq(syncJobs.accountId, accountId))
    .orderBy(desc(syncJobs.createdAt))
    .limit(limit);
}

/**
 * Log sync event (for detailed monitoring)
 */
export async function logSyncEvent(
  accountId: string,
  event: {
    type: 'start' | 'progress' | 'complete' | 'error';
    message: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  // In production, send to monitoring service (e.g., Datadog, New Relic)
  console.log('[SYNC EVENT]', {
    accountId,
    ...event,
    timestamp: new Date().toISOString(),
  });

  // Could also store in a separate sync_events table for historical analysis
}

/**
 * Generate health report for account
 */
export async function generateHealthReport(accountId: string): Promise<{
  status: 'healthy' | 'degraded' | 'critical';
  issues: string[];
  recommendations: string[];
  metrics: SyncMetrics;
}> {
  const metrics = await getAccountMetrics(accountId, 7); // Last 7 days
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check error rate
  if (metrics.errorRate > 50) {
    issues.push(`High error rate: ${metrics.errorRate}%`);
    recommendations.push('Check account authentication and connectivity');
  } else if (metrics.errorRate > 20) {
    issues.push(`Elevated error rate: ${metrics.errorRate}%`);
  }

  // Check uptime
  if (metrics.uptime < 50) {
    issues.push(`Low uptime: ${metrics.uptime}%`);
    recommendations.push(
      'Review sync errors and consider reconnecting account'
    );
  } else if (metrics.uptime < 80) {
    issues.push(`Reduced uptime: ${metrics.uptime}%`);
  }

  // Check if syncing regularly
  const [account] = await db
    .select()
    .from(emailAccounts)
    .where(eq(emailAccounts.id, accountId))
    .limit(1);

  if (account?.lastSyncAt) {
    const hoursSinceSync =
      (Date.now() - new Date(account.lastSyncAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceSync > 48) {
      issues.push(`No sync in ${Math.round(hoursSinceSync)} hours`);
      recommendations.push('Trigger manual sync or check sync schedule');
    }
  }

  // Check sync performance
  if (metrics.averageSyncTime > 60000) {
    // > 1 minute
    issues.push(
      `Slow sync performance: ${Math.round(metrics.averageSyncTime / 1000)}s`
    );
    recommendations.push('Consider reducing sync batch size');
  }

  // Determine overall status
  let status: 'healthy' | 'degraded' | 'critical';
  if (issues.length === 0) {
    status = 'healthy';
  } else if (metrics.errorRate > 50 || metrics.uptime < 50) {
    status = 'critical';
  } else {
    status = 'degraded';
  }

  return {
    status,
    issues,
    recommendations,
    metrics,
  };
}

/**
 * Export metrics to CSV (for reporting)
 */
export async function exportMetricsToCSV(
  userId: string,
  periodDays: number = 30
): Promise<string> {
  const accounts = await db
    .select()
    .from(emailAccounts)
    .where(eq(emailAccounts.userId, userId));

  const rows: string[] = [
    'Account ID,Email Address,Total Syncs,Successful,Failed,Emails Synced,Avg Sync Time (ms),Error Rate (%),Uptime (%)',
  ];

  for (const account of accounts) {
    const metrics = await getAccountMetrics(account.id, periodDays);
    rows.push(
      [
        metrics.accountId,
        account.emailAddress,
        metrics.totalSyncs,
        metrics.successfulSyncs,
        metrics.failedSyncs,
        metrics.totalEmailsSynced,
        metrics.averageSyncTime,
        metrics.errorRate,
        metrics.uptime,
      ].join(',')
    );
  }

  return rows.join('\n');
}
