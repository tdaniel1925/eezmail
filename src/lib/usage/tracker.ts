'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export type ResourceType =
  | 'rag_search'
  | 'ai_query'
  | 'storage'
  | 'email_send'
  | 'api_call';

export interface UsageRecord {
  userId: string;
  resourceType: ResourceType;
  quantity: number;
  metadata?: Record<string, any>;
}

export interface UsageStats {
  resourceType: ResourceType;
  totalQuantity: number;
  uniqueDays: number;
}

/**
 * Track a single usage event
 */
export async function trackUsage(params: UsageRecord): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Insert usage log
    await db.execute(sql`
      INSERT INTO usage_logs (user_id, resource_type, quantity, metadata)
      VALUES (${params.userId}, ${params.resourceType}, ${params.quantity}, ${JSON.stringify(params.metadata || {})})
    `);

    return { success: true };
  } catch (error) {
    console.error('Error tracking usage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Track multiple usage events in batch
 */
export async function trackUsageBatch(
  userId: string,
  records: Omit<UsageRecord, 'userId'>[]
): Promise<{
  success: boolean;
  tracked: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, tracked: 0, error: 'Unauthorized' };
    }

    // Build values for batch insert
    const values = records
      .map(
        (r) =>
          `('${userId}', '${r.resourceType}', ${r.quantity}, '${JSON.stringify(r.metadata || {})}')`
      )
      .join(', ');

    await db.execute(sql`
      INSERT INTO usage_logs (user_id, resource_type, quantity, metadata)
      VALUES ${sql.raw(values)}
    `);

    return { success: true, tracked: records.length };
  } catch (error) {
    console.error('Error tracking usage batch:', error);
    return {
      success: false,
      tracked: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get current month usage for a user
 */
export async function getMonthlyUsage(
  userId: string,
  resourceType?: ResourceType
): Promise<{
  success: boolean;
  usage: UsageStats[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, usage: [], error: 'Unauthorized' };
    }

    // Call Supabase function
    const { data, error } = await supabase.rpc('get_monthly_usage', {
      p_user_id: userId,
      p_resource_type: resourceType || null,
    });

    if (error) {
      return { success: false, usage: [], error: error.message };
    }

    return {
      success: true,
      usage: (data || []).map((row: any) => ({
        resourceType: row.resource_type,
        totalQuantity: parseInt(row.total_quantity),
        uniqueDays: parseInt(row.unique_days),
      })),
    };
  } catch (error) {
    console.error('Error getting monthly usage:', error);
    return {
      success: false,
      usage: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get usage for a specific date range
 */
export async function getUsageByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date,
  resourceType?: ResourceType
): Promise<{
  success: boolean;
  usage: UsageStats[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, usage: [], error: 'Unauthorized' };
    }

    const resourceFilter = resourceType
      ? sql`AND resource_type = ${resourceType}`
      : sql``;

    const result = await db.execute(sql`
      SELECT
        resource_type,
        SUM(quantity) as total_quantity,
        COUNT(DISTINCT DATE(created_at)) as unique_days
      FROM usage_logs
      WHERE
        user_id = ${userId}
        AND created_at >= ${startDate.toISOString()}
        AND created_at <= ${endDate.toISOString()}
        ${resourceFilter}
      GROUP BY resource_type
    `);

    return {
      success: true,
      usage: (result.rows || []).map((row: any) => ({
        resourceType: row.resource_type,
        totalQuantity: parseInt(row.total_quantity),
        uniqueDays: parseInt(row.unique_days),
      })),
    };
  } catch (error) {
    console.error('Error getting usage by date range:', error);
    return {
      success: false,
      usage: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get daily usage breakdown for current month
 */
export async function getDailyUsageBreakdown(
  userId: string,
  resourceType: ResourceType
): Promise<{
  success: boolean;
  usage: Array<{ date: string; quantity: number }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, usage: [], error: 'Unauthorized' };
    }

    const result = await db.execute(sql`
      SELECT
        DATE(created_at) as date,
        SUM(quantity) as quantity
      FROM usage_logs
      WHERE
        user_id = ${userId}
        AND resource_type = ${resourceType}
        AND created_at >= DATE_TRUNC('month', NOW())
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    return {
      success: true,
      usage: (result.rows || []).map((row: any) => ({
        date: row.date,
        quantity: parseInt(row.quantity),
      })),
    };
  } catch (error) {
    console.error('Error getting daily usage breakdown:', error);
    return {
      success: false,
      usage: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if user has exceeded their plan limits
 */
export async function checkUsageLimits(
  userId: string,
  planId: string
): Promise<{
  success: boolean;
  exceeded: Array<{
    resourceType: ResourceType;
    current: number;
    limit: number;
    percentage: number;
  }>;
  error?: string;
}> {
  try {
    // Import here to avoid circular dependencies
    const { getPlan, getLimit, getUsagePercentage } = await import(
      '@/lib/pricing/plans'
    );

    const plan = getPlan(planId as any);
    const usage = await getMonthlyUsage(userId);

    if (!usage.success) {
      return { success: false, exceeded: [], error: usage.error };
    }

    const exceeded: Array<{
      resourceType: ResourceType;
      current: number;
      limit: number;
      percentage: number;
    }> = [];

    // Check RAG searches (daily limit)
    const ragUsage = usage.usage.find((u) => u.resourceType === 'rag_search');
    if (ragUsage) {
      const dailyAvg = Math.ceil(ragUsage.totalQuantity / (ragUsage.uniqueDays || 1));
      const limit = getLimit(planId as any, 'ragSearchesPerDay');
      if (limit !== -1 && dailyAvg >= limit) {
        exceeded.push({
          resourceType: 'rag_search',
          current: dailyAvg,
          limit,
          percentage: getUsagePercentage(planId as any, 'ragSearchesPerDay', dailyAvg),
        });
      }
    }

    // Check AI queries (monthly limit)
    const aiUsage = usage.usage.find((u) => u.resourceType === 'ai_query');
    if (aiUsage) {
      const limit = getLimit(planId as any, 'aiQueriesPerMonth');
      if (limit !== -1 && aiUsage.totalQuantity >= limit) {
        exceeded.push({
          resourceType: 'ai_query',
          current: aiUsage.totalQuantity,
          limit,
          percentage: getUsagePercentage(
            planId as any,
            'aiQueriesPerMonth',
            aiUsage.totalQuantity
          ),
        });
      }
    }

    return { success: true, exceeded };
  } catch (error) {
    console.error('Error checking usage limits:', error);
    return {
      success: false,
      exceeded: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

