/**
 * Alert Rule Evaluation Background Job
 * Evaluates alert rules and triggers notifications
 */

import { inngest } from '../client';
import { db } from '@/db';
import { alertRules, alertEvents, systemMetrics } from '@/db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

export const alertRuleEvaluation = inngest.createFunction(
  {
    id: 'alert-rule-evaluation',
    name: 'Evaluate Alert Rules',
  },
  { cron: '* * * * *' }, // Run every minute
  async ({ step }) => {
    const rules = await step.run('fetch-enabled-rules', async () => {
      return await db
        .select()
        .from(alertRules)
        .where(eq(alertRules.enabled, true));
    });

    const results = await step.run('evaluate-rules', async () => {
      const evaluationResults = [];

      for (const rule of rules) {
        // Get recent metrics for this rule
        const cutoffTime = new Date(
          Date.now() - rule.durationMinutes * 60 * 1000
        );

        const metrics = await db
          .select()
          .from(systemMetrics)
          .where(
            and(
              eq(systemMetrics.metricName, rule.metric),
              gte(systemMetrics.timestamp, cutoffTime)
            )
          )
          .orderBy(desc(systemMetrics.timestamp))
          .limit(100);

        if (metrics.length === 0) continue;

        // Calculate average metric value
        const avgValue =
          metrics.reduce(
            (sum, m) => sum + parseFloat(m.metricValue.toString()),
            0
          ) / metrics.length;

        // Check if threshold is breached
        let breached = false;
        switch (rule.operator) {
          case 'gt':
            breached = avgValue > parseFloat(rule.threshold.toString());
            break;
          case 'lt':
            breached = avgValue < parseFloat(rule.threshold.toString());
            break;
          case 'eq':
            breached = avgValue === parseFloat(rule.threshold.toString());
            break;
          case 'gte':
            breached = avgValue >= parseFloat(rule.threshold.toString());
            break;
          case 'lte':
            breached = avgValue <= parseFloat(rule.threshold.toString());
            break;
        }

        if (breached) {
          // Create alert event
          await db.insert(alertEvents).values({
            alertRuleId: rule.id,
            severity: rule.severity,
            message: `Alert: ${rule.name} - ${rule.metric} is ${avgValue.toFixed(2)} (threshold: ${rule.threshold})`,
            metricValue: avgValue.toString(),
            metadata: {
              ruleId: rule.id,
              ruleName: rule.name,
              metric: rule.metric,
              operator: rule.operator,
              threshold: rule.threshold,
              measuredValue: avgValue,
            },
          });

          // Update last triggered time
          await db
            .update(alertRules)
            .set({ lastTriggeredAt: new Date() })
            .where(eq(alertRules.id, rule.id));

          evaluationResults.push({
            rule: rule.name,
            status: 'triggered',
            value: avgValue,
          });

          // TODO: Send notifications based on notification_channels
        } else {
          evaluationResults.push({
            rule: rule.name,
            status: 'ok',
            value: avgValue,
          });
        }
      }

      return evaluationResults;
    });

    return {
      success: true,
      rulesEvaluated: rules.length,
      results,
    };
  }
);
