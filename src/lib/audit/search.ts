/**
 * Admin Audit Log Search
 * Advanced search and filtering for system audit logs
 */

export interface SearchFilters {
  query?: string;
  action?: string;
  resourceType?: string;
  actorId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  logs: Array<{
    id: string;
    actorId: string;
    actorEmail: string;
    action: string;
    resourceType: string;
    resourceId: string | null;
    riskLevel: string;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
  }>;
  total: number;
  hasMore: boolean;
}

import { db } from '@/db';
import { auditLogs } from '@/db/schema';
import { and, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';

/**
 * Search audit logs with advanced filtering
 */
export async function searchAuditLogs(
  filters: SearchFilters
): Promise<SearchResult> {
  const {
    query,
    action,
    resourceType,
    actorId,
    startDate,
    endDate,
    limit = 100,
    offset = 0,
  } = filters;

  // Build where conditions
  const conditions = [];

  if (query) {
    conditions.push(
      or(
        ilike(auditLogs.action, `%${query}%`),
        ilike(auditLogs.actorEmail, `%${query}%`),
        ilike(auditLogs.resourceType, `%${query}%`)
      )
    );
  }

  if (action) {
    conditions.push(eq(auditLogs.action, action));
  }

  if (resourceType) {
    conditions.push(eq(auditLogs.resourceType, resourceType));
  }

  if (actorId) {
    conditions.push(eq(auditLogs.actorId, actorId));
  }

  if (startDate) {
    conditions.push(gte(auditLogs.createdAt, startDate));
  }

  if (endDate) {
    conditions.push(lte(auditLogs.createdAt, endDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(auditLogs)
    .where(whereClause);

  // Get paginated results
  const logs = await db
    .select({
      id: auditLogs.id,
      actorId: auditLogs.actorId,
      actorEmail: auditLogs.actorEmail,
      action: auditLogs.action,
      resourceType: auditLogs.resourceType,
      resourceId: auditLogs.resourceId,
      riskLevel: auditLogs.riskLevel,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .where(whereClause)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit + 1) // Fetch one extra to check if there are more
    .offset(offset);

  const hasMore = logs.length > limit;
  const results = hasMore ? logs.slice(0, limit) : logs;

  return {
    logs: results.map((log) => ({
      id: log.id,
      actorId: log.actorId,
      actorEmail: log.actorEmail,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      riskLevel: log.riskLevel,
      metadata: log.metadata as Record<string, unknown> | null,
      createdAt: new Date(log.createdAt),
    })),
    total: count,
    hasMore,
  };
}

/**
 * Get available action types for filtering
 */
export async function getAvailableActions(): Promise<string[]> {
  const results = await db
    .selectDistinct({ action: auditLogs.action })
    .from(auditLogs)
    .orderBy(auditLogs.action);

  return results.map((r) => r.action);
}

/**
 * Get available resource types for filtering
 */
export async function getAvailableResourceTypes(): Promise<string[]> {
  const results = await db
    .selectDistinct({ resourceType: auditLogs.resourceType })
    .from(auditLogs)
    .where(sql`${auditLogs.resourceType} IS NOT NULL`)
    .orderBy(auditLogs.resourceType);

  return results.map((r) => r.resourceType);
}
