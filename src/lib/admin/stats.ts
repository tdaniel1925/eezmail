'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from './auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  mrr: number;
  churnRate: number;
  totalEmails: number;
  totalRagSearches: number;
  totalAiQueries: number;
}

export interface SubscriptionStat {
  tier: string;
  count: number;
  percentage: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  subscriptions: number;
}

/**
 * Get dashboard overview stats
 */
export async function getDashboardStats(): Promise<{
  success: boolean;
  stats?: DashboardStats;
  error?: string;
}> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Get MRR and subscription stats
    const { data: mrrData, error: mrrError } = await supabase.rpc('get_mrr');
    
    if (mrrError) {
      throw mrrError;
    }

    const stats = mrrData?.[0] || { mrr: 0, active_subscriptions: 0, total_users: 0 };

    // Get total emails
    const emailCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM emails
    `);
    const totalEmails = parseInt(emailCount.rows[0]?.count || '0');

    // Get total usage stats
    const ragSearches = await db.execute(sql`
      SELECT COALESCE(SUM(quantity), 0) as count 
      FROM usage_logs 
      WHERE resource_type = 'rag_search'
      AND created_at >= NOW() - INTERVAL '30 days'
    `);
    const totalRagSearches = parseInt(ragSearches.rows[0]?.count || '0');

    const aiQueries = await db.execute(sql`
      SELECT COALESCE(SUM(quantity), 0) as count 
      FROM usage_logs 
      WHERE resource_type = 'ai_query'
      AND created_at >= NOW() - INTERVAL '30 days'
    `);
    const totalAiQueries = parseInt(aiQueries.rows[0]?.count || '0');

    // Calculate churn rate (simplified - last 30 days)
    const canceledResult = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM subscriptions 
      WHERE status = 'canceled' 
      AND canceled_at >= NOW() - INTERVAL '30 days'
    `);
    const canceledCount = parseInt(canceledResult.rows[0]?.count || '0');
    const activeCount = parseInt(stats.active_subscriptions || '0');
    const churnRate = activeCount > 0 ? (canceledCount / (activeCount + canceledCount)) * 100 : 0;

    return {
      success: true,
      stats: {
        totalUsers: parseInt(stats.total_users || '0'),
        activeSubscriptions: activeCount,
        mrr: parseFloat(stats.mrr || '0'),
        churnRate: Math.round(churnRate * 100) / 100,
        totalEmails,
        totalRagSearches,
        totalAiQueries,
      },
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats',
    };
  }
}

/**
 * Get subscription distribution by tier
 */
export async function getSubscriptionStats(): Promise<{
  success: boolean;
  stats?: SubscriptionStat[];
  error?: string;
}> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_subscription_stats');
    
    if (error) {
      throw error;
    }

    return {
      success: true,
      stats: (data || []).map((row: any) => ({
        tier: row.tier,
        count: parseInt(row.count),
        percentage: parseFloat(row.percentage),
      })),
    };
  } catch (error) {
    console.error('Error getting subscription stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats',
    };
  }
}

/**
 * Get revenue data for chart (last 30 days)
 */
export async function getRevenueData(): Promise<{
  success: boolean;
  data?: RevenueData[];
  error?: string;
}> {
  try {
    await requireAdmin();

    const result = await db.execute(sql`
      WITH plan_prices AS (
        SELECT 'free' as tier, 0 as price
        UNION ALL SELECT 'starter', 15
        UNION ALL SELECT 'professional', 35
        UNION ALL SELECT 'enterprise', 99
      ),
      daily_revenue AS (
        SELECT
          DATE(s.created_at) as date,
          COUNT(*) as subscriptions,
          SUM(pp.price) as revenue
        FROM subscriptions s
        JOIN plan_prices pp ON pp.tier = s.tier
        WHERE s.created_at >= NOW() - INTERVAL '30 days'
          AND s.status IN ('active', 'trialing')
        GROUP BY DATE(s.created_at)
        ORDER BY date DESC
      )
      SELECT * FROM daily_revenue
    `);

    return {
      success: true,
      data: (result.rows || []).map((row: any) => ({
        date: row.date,
        revenue: parseFloat(row.revenue || '0'),
        subscriptions: parseInt(row.subscriptions || '0'),
      })),
    };
  } catch (error) {
    console.error('Error getting revenue data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get revenue data',
    };
  }
}

/**
 * Get recent signups (last 10)
 */
export async function getRecentSignups(): Promise<{
  success: boolean;
  users?: Array<{
    id: string;
    email: string;
    createdAt: string;
    tier: string;
  }>;
  error?: string;
}> {
  try {
    await requireAdmin();

    const result = await db.execute(sql`
      SELECT
        u.id,
        u.email,
        u.created_at,
        COALESCE(s.tier, 'free') as tier
      FROM auth.users u
      LEFT JOIN subscriptions s ON s.user_id = u.id
      ORDER BY u.created_at DESC
      LIMIT 10
    `);

    return {
      success: true,
      users: (result.rows || []).map((row: any) => ({
        id: row.id,
        email: row.email,
        createdAt: row.created_at,
        tier: row.tier,
      })),
    };
  } catch (error) {
    console.error('Error getting recent signups:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get recent signups',
    };
  }
}

/**
 * Get usage stats by resource type
 */
export async function getUsageStats(days: number = 30): Promise<{
  success: boolean;
  stats?: Array<{
    resourceType: string;
    total: number;
    average: number;
  }>;
  error?: string;
}> {
  try {
    await requireAdmin();

    const result = await db.execute(sql`
      SELECT
        resource_type,
        SUM(quantity) as total,
        AVG(quantity) as average
      FROM usage_logs
      WHERE created_at >= NOW() - INTERVAL '${sql.raw(days.toString())} days'
      GROUP BY resource_type
      ORDER BY total DESC
    `);

    return {
      success: true,
      stats: (result.rows || []).map((row: any) => ({
        resourceType: row.resource_type,
        total: parseInt(row.total || '0'),
        average: parseFloat(row.average || '0'),
      })),
    };
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get usage stats',
    };
  }
}

