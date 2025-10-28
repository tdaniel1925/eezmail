/**
 * Performance Profiler
 * Identify slow queries and performance bottlenecks
 */

import { db } from '@/db';
import { auditLogs } from '@/db/schema';
import { desc, and, gte, sql } from 'drizzle-orm';

export interface SlowQuery {
  endpoint: string;
  method: string;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  count: number;
  failureRate: number;
}

export interface APILatency {
  timestamp: Date;
  endpoint: string;
  duration: number;
  status: number;
}

export interface PerformanceMetrics {
  slowQueries: SlowQuery[];
  recentLatency: APILatency[];
  summary: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    totalRequests: number;
    errorRate: number;
  };
}

/**
 * Get slow queries (>1 second)
 */
export async function getSlowQueries(options: {
  minDuration?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<SlowQuery[]> {
  const { minDuration = 1000, limit = 50, startDate, endDate } = options;

  const conditions = [];
  if (startDate) conditions.push(gte(auditLogs.createdAt, startDate));
  if (endDate) {
    conditions.push(sql`${auditLogs.createdAt} <= ${endDate}`);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Query audit logs for API requests with duration info
  const results = await db
    .select({
      endpoint: sql<string>`${auditLogs.action}`,
      method: sql<string>`COALESCE(${auditLogs.metadata}->>'method', 'UNKNOWN')`,
      avgDuration: sql<number>`AVG((${auditLogs.metadata}->>'duration')::numeric)::int`,
      maxDuration: sql<number>`MAX((${auditLogs.metadata}->>'duration')::numeric)::int`,
      minDuration: sql<number>`MIN((${auditLogs.metadata}->>'duration')::numeric)::int`,
      count: sql<number>`count(*)::int`,
      failures: sql<number>`count(*) FILTER (WHERE ${auditLogs.riskLevel} = 'high')::int`,
    })
    .from(auditLogs)
    .where(
      and(
        whereClause,
        sql`(${auditLogs.metadata}->>'duration')::numeric > ${minDuration}`
      )
    )
    .groupBy(sql`${auditLogs.action}`, sql`${auditLogs.metadata}->>'method'`)
    .orderBy(desc(sql`AVG((${auditLogs.metadata}->>'duration')::numeric)`))
    .limit(limit);

  return results.map((r) => ({
    endpoint: r.endpoint,
    method: r.method,
    avgDuration: r.avgDuration,
    maxDuration: r.maxDuration,
    minDuration: r.minDuration,
    count: r.count,
    failureRate: r.count > 0 ? Math.round((r.failures / r.count) * 100) : 0,
  }));
}

/**
 * Get recent API latency data
 */
export async function getRecentLatency(options: {
  limit?: number;
  startDate?: Date;
}): Promise<APILatency[]> {
  const { limit = 1000, startDate } = options;

  const conditions = [];
  if (startDate) conditions.push(gte(auditLogs.createdAt, startDate));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select({
      timestamp: auditLogs.createdAt,
      endpoint: auditLogs.action,
      duration: sql<number>`COALESCE((${auditLogs.metadata}->>'duration')::numeric, 0)::int`,
      status: sql<number>`COALESCE((${auditLogs.metadata}->>'status')::numeric, 200)::int`,
    })
    .from(auditLogs)
    .where(
      and(whereClause, sql`${auditLogs.metadata}->>'duration' IS NOT NULL`)
    )
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);

  return results.map((r) => ({
    timestamp: new Date(r.timestamp),
    endpoint: r.endpoint,
    duration: r.duration,
    status: r.status,
  }));
}

/**
 * Get comprehensive performance metrics
 */
export async function getPerformanceMetrics(options: {
  startDate?: Date;
  endDate?: Date;
}): Promise<PerformanceMetrics> {
  const { startDate, endDate } = options;

  // Get slow queries
  const slowQueries = await getSlowQueries({
    minDuration: 1000,
    limit: 20,
    startDate,
    endDate,
  });

  // Get recent latency
  const recentLatency = await getRecentLatency({
    limit: 1000,
    startDate,
  });

  // Calculate summary stats
  const durations = recentLatency.map((r) => r.duration).sort((a, b) => a - b);
  const totalRequests = durations.length;
  const avgResponseTime =
    totalRequests > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / totalRequests)
      : 0;

  const p95Index = Math.floor(totalRequests * 0.95);
  const p99Index = Math.floor(totalRequests * 0.99);
  const p95ResponseTime = totalRequests > 0 ? durations[p95Index] || 0 : 0;
  const p99ResponseTime = totalRequests > 0 ? durations[p99Index] || 0 : 0;

  const errors = recentLatency.filter((r) => r.status >= 400).length;
  const errorRate =
    totalRequests > 0 ? Math.round((errors / totalRequests) * 100) : 0;

  return {
    slowQueries,
    recentLatency: recentLatency.slice(0, 100), // Return most recent 100
    summary: {
      avgResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      totalRequests,
      errorRate,
    },
  };
}

/**
 * Get endpoint performance breakdown
 */
export async function getEndpointPerformance(options: {
  startDate?: Date;
  endDate?: Date;
}): Promise<
  Array<{
    endpoint: string;
    requests: number;
    avgDuration: number;
    errorRate: number;
  }>
> {
  const { startDate, endDate } = options;

  const conditions = [];
  if (startDate) conditions.push(gte(auditLogs.createdAt, startDate));
  if (endDate) {
    conditions.push(sql`${auditLogs.createdAt} <= ${endDate}`);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select({
      endpoint: auditLogs.action,
      requests: sql<number>`count(*)::int`,
      avgDuration: sql<number>`COALESCE(AVG((${auditLogs.metadata}->>'duration')::numeric), 0)::int`,
      errors: sql<number>`count(*) FILTER (WHERE ${auditLogs.riskLevel} = 'high')::int`,
    })
    .from(auditLogs)
    .where(whereClause)
    .groupBy(auditLogs.action)
    .orderBy(desc(sql`count(*)`))
    .limit(20);

  return results.map((r) => ({
    endpoint: r.endpoint,
    requests: r.requests,
    avgDuration: r.avgDuration,
    errorRate: r.requests > 0 ? Math.round((r.errors / r.requests) * 100) : 0,
  }));
}

/**
 * Get API latency metrics for the last N hours
 */
export async function getAPILatencyMetrics(
  hours: number = 24
): Promise<PerformanceMetrics> {
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  return getPerformanceMetrics({ startDate });
}
