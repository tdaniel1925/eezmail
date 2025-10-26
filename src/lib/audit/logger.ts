/**
 * Audit Logging Service
 * HIPAA-compliant audit logging for all system actions
 */

import { db } from '@/db';
import { auditLogs } from '@/db/schema';
import { eq, and, gte, lte, desc, or, ilike, sql } from 'drizzle-orm';
import type {
  AuditLogEntry,
  AuditLogFilter,
  AuditAction,
  ResourceType,
  RiskLevel,
  AuditStatistics,
} from './types';

/**
 * Calculate risk level based on action and resource type
 */
function calculateRiskLevel(entry: AuditLogEntry): RiskLevel {
  // Critical actions
  const criticalActions: AuditAction[] = [
    'user_impersonate_start',
    'bulk_delete',
    'user_suspend',
    'payment_processed',
    'refund_issued',
  ];

  // High-risk actions
  const highRiskActions: AuditAction[] = [
    'delete',
    'role_change',
    'permission_grant',
    'permission_revoke',
    'mfa_disable',
    'password_reset',
    'integration_disconnect',
  ];

  // Medium-risk actions
  const mediumRiskActions: AuditAction[] = [
    'update',
    'settings_update',
    'password_change',
    'integration_connect',
  ];

  // Check critical
  if (criticalActions.includes(entry.action)) {
    return 'critical';
  }

  // Check high-risk
  if (highRiskActions.includes(entry.action)) {
    return 'high';
  }

  // Check medium-risk
  if (mediumRiskActions.includes(entry.action)) {
    return 'medium';
  }

  // If impersonated, increase risk
  if (entry.impersonatorId) {
    if (entry.action === 'update' || entry.action === 'create') {
      return 'high';
    }
    return 'medium';
  }

  // Default low risk
  return 'low';
}

/**
 * Log an audit action
 */
export async function logAuditAction(entry: AuditLogEntry): Promise<void> {
  try {
    const riskLevel = calculateRiskLevel(entry);

    await db.insert(auditLogs).values({
      actorId: entry.actorId,
      actorType: entry.actorType,
      actorEmail: entry.actorEmail,
      impersonatorId: entry.impersonatorId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      organizationId: entry.organizationId,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      requestId: entry.requestId,
      sessionId: entry.sessionId,
      changes: entry.changes as Record<string, unknown>,
      metadata: entry.metadata,
      riskLevel,
    });
  } catch (error) {
    // Log to console but don't throw - audit logging failures shouldn't break the app
    console.error('[Audit] Failed to log action:', error);
  }
}

/**
 * Query audit logs with filters
 */
export async function getAuditLogs(
  filter: AuditLogFilter
): Promise<{ logs: AuditLogEntry[]; total: number }> {
  const {
    actorId,
    actorType,
    action,
    resourceType,
    resourceId,
    organizationId,
    riskLevel,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 50,
  } = filter;

  const conditions = [];

  if (actorId) conditions.push(eq(auditLogs.actorId, actorId));
  if (actorType) conditions.push(eq(auditLogs.actorType, actorType));
  if (action) conditions.push(eq(auditLogs.action, action));
  if (resourceType) conditions.push(eq(auditLogs.resourceType, resourceType));
  if (resourceId) conditions.push(eq(auditLogs.resourceId, resourceId));
  if (organizationId)
    conditions.push(eq(auditLogs.organizationId, organizationId));
  if (riskLevel) conditions.push(eq(auditLogs.riskLevel, riskLevel));
  if (startDate) conditions.push(gte(auditLogs.createdAt, startDate));
  if (endDate) conditions.push(lte(auditLogs.createdAt, endDate));

  if (search) {
    conditions.push(
      or(
        ilike(auditLogs.actorEmail, `%${search}%`),
        ilike(auditLogs.action, `%${search}%`),
        ilike(auditLogs.resourceType, `%${search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(auditLogs)
    .where(whereClause);

  const total = Number(countResult[0]?.count || 0);

  // Get paginated logs
  const logs = await db
    .select()
    .from(auditLogs)
    .where(whereClause)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return {
    logs: logs as AuditLogEntry[],
    total,
  };
}

/**
 * Get audit statistics
 */
export async function getAuditStatistics(
  startDate: Date,
  endDate: Date
): Promise<AuditStatistics> {
  const logs = await db
    .select()
    .from(auditLogs)
    .where(
      and(
        gte(auditLogs.createdAt, startDate),
        lte(auditLogs.createdAt, endDate)
      )
    );

  // Calculate statistics
  const totalActions = logs.length;

  const actionsByType: Record<string, number> = {};
  const actionsByRisk: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  const actorCounts: Record<string, { email: string; count: number }> = {};

  for (const log of logs) {
    // Count by action type
    actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;

    // Count by risk level
    if (log.riskLevel) {
      actionsByRisk[log.riskLevel] = (actionsByRisk[log.riskLevel] || 0) + 1;
    }

    // Count by actor
    if (log.actorId) {
      if (!actorCounts[log.actorId]) {
        actorCounts[log.actorId] = {
          email: log.actorEmail || 'Unknown',
          count: 0,
        };
      }
      actorCounts[log.actorId].count++;
    }
  }

  // Get top actors
  const topActors = Object.entries(actorCounts)
    .map(([actorId, data]) => ({
      actorId,
      actorEmail: data.email,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Get recent high-risk actions
  const recentHighRiskActions = logs
    .filter((log) => log.riskLevel === 'high' || log.riskLevel === 'critical')
    .sort(
      (a, b) =>
        new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    )
    .slice(0, 20) as AuditLogEntry[];

  return {
    totalActions,
    actionsByType: actionsByType as Record<AuditAction, number>,
    actionsByRisk: actionsByRisk as Record<RiskLevel, number>,
    topActors,
    recentHighRiskActions,
  };
}

/**
 * Export audit logs to CSV
 */
export async function exportAuditLogsToCSV(
  filter: AuditLogFilter
): Promise<string> {
  const { logs } = await getAuditLogs({ ...filter, limit: 10000 });

  const headers = [
    'ID',
    'Actor Email',
    'Actor Type',
    'Action',
    'Resource Type',
    'Resource ID',
    'Risk Level',
    'IP Address',
    'Created At',
  ];

  const rows = logs.map((log) => [
    log.id,
    log.actorEmail,
    log.actorType,
    log.action,
    log.resourceType,
    log.resourceId,
    log.riskLevel,
    log.ipAddress,
    log.createdAt?.toISOString(),
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join(
    '\n'
  );

  return csv;
}

/**
 * Delete old audit logs based on retention policy
 */
export async function archiveOldAuditLogs(
  retentionDays: number
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const result = await db
    .delete(auditLogs)
    .where(lte(auditLogs.createdAt, cutoffDate));

  return 0; // Drizzle doesn't return affected rows count easily
}
