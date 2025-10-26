/**
 * Metrics Collection Service
 * Track and store system metrics
 */

import { db } from '@/db';
import { systemMetrics, alertRules, alertEvents } from '@/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';

export interface MetricData {
  metric: string;
  value: number;
  tags?: Record<string, string>;
}

/**
 * Track a system metric
 */
export async function trackMetric(
  metric: string,
  value: number,
  tags?: Record<string, string>
): Promise<void> {
  await db.insert(systemMetrics).values({
    metric,
    value: String(value),
    tags: tags || {},
    timestamp: new Date(),
  });

  // Evaluate alert rules for this metric
  await evaluateMetricAlerts(metric, value);
}

/**
 * Evaluate alert rules for a specific metric
 */
async function evaluateMetricAlerts(
  metric: string,
  value: number
): Promise<void> {
  // Get all enabled rules for this metric
  const rules = await db
    .select()
    .from(alertRules)
    .where(and(eq(alertRules.metric, metric), eq(alertRules.enabled, true)));

  for (const rule of rules) {
    let triggered = false;

    // Check if threshold is breached
    switch (rule.operator) {
      case 'gt':
        triggered = value > Number(rule.threshold);
        break;
      case 'lt':
        triggered = value < Number(rule.threshold);
        break;
      case 'eq':
        triggered = value === Number(rule.threshold);
        break;
      case 'gte':
        triggered = value >= Number(rule.threshold);
        break;
      case 'lte':
        triggered = value <= Number(rule.threshold);
        break;
    }

    if (triggered) {
      // Check if there's an existing active alert
      const existingAlerts = await db
        .select()
        .from(alertEvents)
        .where(
          and(
            eq(alertEvents.alertRuleId, rule.id),
            eq(alertEvents.resolvedAt, null)
          )
        )
        .limit(1);

      // Only create new alert if there isn't an active one
      if (existingAlerts.length === 0) {
        await db.insert(alertEvents).values({
          alertRuleId: rule.id,
          severity: rule.severity,
          message: `${rule.name}: ${metric} ${rule.operator} ${rule.threshold} (current: ${value})`,
          metadata: {
            metric,
            value,
            threshold: rule.threshold,
            operator: rule.operator,
          },
        });

        // Update last triggered timestamp
        await db
          .update(alertRules)
          .set({ lastTriggeredAt: new Date() })
          .where(eq(alertRules.id, rule.id));

        // Send notifications (email, Slack, etc.)
        await sendAlertNotifications(rule, value);
      }
    }
  }
}

/**
 * Send alert notifications
 */
async function sendAlertNotifications(
  rule: typeof alertRules.$inferSelect,
  value: number
): Promise<void> {
  const channels = rule.notificationChannels as {
    email?: string[];
    slack?: string;
    webhook?: string;
  };

  console.log(`[ALERT] ${rule.name}: ${rule.metric} = ${value}`, channels);

  // TODO: Implement actual notification sending
  // - Email via Resend/SendGrid
  // - Slack via webhook
  // - Custom webhooks
}

/**
 * Get recent metrics for a specific type
 */
export async function getRecentMetrics(
  metric: string,
  hours: number = 1
): Promise<Array<typeof systemMetrics.$inferSelect>> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  return db
    .select()
    .from(systemMetrics)
    .where(
      and(eq(systemMetrics.metric, metric), gte(systemMetrics.timestamp, since))
    )
    .orderBy(desc(systemMetrics.timestamp))
    .limit(100);
}

/**
 * Resolve an alert
 */
export async function resolveAlert(alertId: string): Promise<void> {
  await db
    .update(alertEvents)
    .set({ resolvedAt: new Date() })
    .where(eq(alertEvents.id, alertId));
}

/**
 * Re-export metrics constants for backwards compatibility
 */
export { METRICS } from './metrics-constants';
