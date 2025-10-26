/**
 * Advanced Analytics Service
 * Cohort analysis, feature adoption, and custom reports
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';

export interface CohortData {
  cohortMonth: string;
  usersCount: number;
  retentionMonth1: number;
  retentionMonth3: number;
  retentionMonth6: number;
  retentionMonth12: number;
  avgRevenuePerUser: number;
}

export interface FeatureUsage {
  featureName: string;
  date: string;
  totalUsers: number;
  activeUsers: number;
  usageCount: number;
  adoptionRate: number;
}

export interface ChurnPrediction {
  userId: string;
  userEmail: string;
  churnProbability: number;
  riskLevel: string;
  contributingFactors: string[];
  lastActivityDate: string;
  engagementScore: number;
}

export interface RevenueAttribution {
  featureName: string;
  totalRevenue: number;
  userCount: number;
  avgRevenuePerUser: number;
}

/**
 * Get cohort analysis data
 */
export async function getCohortAnalysis(options: {
  startMonth?: Date;
  endMonth?: Date;
  limit?: number;
}): Promise<CohortData[]> {
  const { startMonth, endMonth, limit = 12 } = options;

  const conditions = [];
  if (startMonth) {
    conditions.push(sql`cohort_month >= ${startMonth}`);
  }
  if (endMonth) {
    conditions.push(sql`cohort_month <= ${endMonth}`);
  }

  const whereClause =
    conditions.length > 0
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``;

  const results = await db.execute(sql`
    SELECT
      cohort_month,
      users_count,
      retention_month_1,
      retention_month_3,
      retention_month_6,
      retention_month_12,
      avg_revenue_per_user
    FROM cohort_analysis
    ${whereClause}
    ORDER BY cohort_month DESC
    LIMIT ${limit}
  `);

  return results.rows.map((row: any) => ({
    cohortMonth: row.cohort_month,
    usersCount: row.users_count,
    retentionMonth1: parseFloat(row.retention_month_1) || 0,
    retentionMonth3: parseFloat(row.retention_month_3) || 0,
    retentionMonth6: parseFloat(row.retention_month_6) || 0,
    retentionMonth12: parseFloat(row.retention_month_12) || 0,
    avgRevenuePerUser: parseFloat(row.avg_revenue_per_user) || 0,
  }));
}

/**
 * Get feature adoption metrics
 */
export async function getFeatureAdoption(options: {
  startDate?: Date;
  endDate?: Date;
  featureName?: string;
}): Promise<FeatureUsage[]> {
  const { startDate, endDate, featureName } = options;

  const conditions = [];
  if (startDate) {
    conditions.push(sql`date >= ${startDate}`);
  }
  if (endDate) {
    conditions.push(sql`date <= ${endDate}`);
  }
  if (featureName) {
    conditions.push(sql`feature_name = ${featureName}`);
  }

  const whereClause =
    conditions.length > 0
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``;

  const results = await db.execute(sql`
    SELECT
      feature_name,
      date,
      total_users,
      active_users,
      usage_count,
      ROUND((active_users::DECIMAL / NULLIF(total_users, 0)) * 100, 2) as adoption_rate
    FROM feature_usage_stats
    ${whereClause}
    ORDER BY date DESC, feature_name
    LIMIT 100
  `);

  return results.rows.map((row: any) => ({
    featureName: row.feature_name,
    date: row.date,
    totalUsers: row.total_users,
    activeUsers: row.active_users,
    usageCount: row.usage_count,
    adoptionRate: parseFloat(row.adoption_rate) || 0,
  }));
}

/**
 * Get users at risk of churning
 */
export async function getChurnPredictions(options: {
  riskLevel?: string;
  limit?: number;
}): Promise<ChurnPrediction[]> {
  const { riskLevel, limit = 50 } = options;

  const whereClause = riskLevel
    ? sql`WHERE cp.risk_level = ${riskLevel}`
    : sql``;

  const results = await db.execute(sql`
    SELECT
      cp.user_id,
      u.email as user_email,
      cp.churn_probability,
      cp.risk_level,
      cp.contributing_factors,
      cp.last_activity_date,
      cp.engagement_score
    FROM churn_predictions cp
    LEFT JOIN users u ON cp.user_id = u.id
    ${whereClause}
    ORDER BY cp.churn_probability DESC
    LIMIT ${limit}
  `);

  return results.rows.map((row: any) => ({
    userId: row.user_id,
    userEmail: row.user_email,
    churnProbability: parseFloat(row.churn_probability),
    riskLevel: row.risk_level,
    contributingFactors: row.contributing_factors || [],
    lastActivityDate: row.last_activity_date,
    engagementScore: parseFloat(row.engagement_score) || 0,
  }));
}

/**
 * Get revenue attribution by feature
 */
export async function getRevenueAttribution(options: {
  startMonth?: Date;
  endMonth?: Date;
}): Promise<RevenueAttribution[]> {
  const { startMonth, endMonth } = options;

  const conditions = [];
  if (startMonth) {
    conditions.push(sql`period_month >= ${startMonth}`);
  }
  if (endMonth) {
    conditions.push(sql`period_month <= ${endMonth}`);
  }

  const whereClause =
    conditions.length > 0
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``;

  const results = await db.execute(sql`
    SELECT
      feature_name,
      SUM(revenue_amount) as total_revenue,
      COUNT(DISTINCT user_id) as user_count,
      ROUND(SUM(revenue_amount) / COUNT(DISTINCT user_id), 2) as avg_revenue_per_user
    FROM revenue_attribution
    ${whereClause}
    GROUP BY feature_name
    ORDER BY total_revenue DESC
    LIMIT 20
  `);

  return results.rows.map((row: any) => ({
    featureName: row.feature_name,
    totalRevenue: parseFloat(row.total_revenue),
    userCount: row.user_count,
    avgRevenuePerUser: parseFloat(row.avg_revenue_per_user),
  }));
}

/**
 * Track user activity event
 */
export async function trackUserActivity(
  userId: string,
  eventType: string,
  eventData?: Record<string, unknown>
): Promise<void> {
  await db.execute(sql`
    INSERT INTO user_activity_events (user_id, event_type, event_data)
    VALUES (${userId}, ${eventType}, ${JSON.stringify(eventData || {})})
  `);
}

/**
 * Calculate retention for a specific cohort
 */
export async function calculateCohortRetention(cohortMonth: Date): Promise<
  Array<{
    monthOffset: number;
    retainedUsers: number;
    retentionRate: number;
  }>
> {
  const results = await db.execute(sql`
    SELECT * FROM calculate_retention(${cohortMonth})
  `);

  return results.rows.map((row: any) => ({
    monthOffset: row.month_offset,
    retainedUsers: row.retained_users,
    retentionRate: parseFloat(row.retention_rate),
  }));
}

/**
 * Get engagement summary
 */
export async function getEngagementSummary(options: {
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  totalUsers: number;
  activeUsers: number;
  totalEvents: number;
  avgEventsPerUser: number;
  topFeatures: Array<{ feature: string; count: number }>;
}> {
  const { startDate, endDate } = options;

  const conditions = [];
  if (startDate) {
    conditions.push(sql`timestamp >= ${startDate}`);
  }
  if (endDate) {
    conditions.push(sql`timestamp <= ${endDate}`);
  }

  const whereClause =
    conditions.length > 0
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
      : sql``;

  const [summary] = await db.execute(sql`
    SELECT
      COUNT(DISTINCT user_id) as active_users,
      COUNT(*) as total_events,
      ROUND(COUNT(*)::DECIMAL / NULLIF(COUNT(DISTINCT user_id), 0), 2) as avg_events_per_user
    FROM user_activity_events
    ${whereClause}
  `);

  const topFeatures = await db.execute(sql`
    SELECT
      event_type as feature,
      COUNT(*) as count
    FROM user_activity_events
    ${whereClause}
    GROUP BY event_type
    ORDER BY count DESC
    LIMIT 10
  `);

  const [totalUsersResult] = await db.execute(sql`
    SELECT COUNT(*) as total_users FROM users
  `);

  return {
    totalUsers: totalUsersResult.rows[0].total_users,
    activeUsers: summary.rows[0].active_users,
    totalEvents: summary.rows[0].total_events,
    avgEventsPerUser: parseFloat(summary.rows[0].avg_events_per_user) || 0,
    topFeatures: topFeatures.rows.map((row: any) => ({
      feature: row.feature,
      count: row.count,
    })),
  };
}
