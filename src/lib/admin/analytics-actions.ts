/**
 * Analytics Actions for Platform Admin
 * Revenue, usage, and churn analytics
 */

'use server';

import { db } from '@/db';
import {
  communicationLogs,
  aiTransactions,
  users,
  organizations,
  trialCredits,
  customerSubscriptions,
} from '@/db/schema';
import { eq, sql, desc, and, gte, lte } from 'drizzle-orm';
import { requirePlatformAdmin } from './platform-middleware';

// ============================================================================
// REVENUE ANALYTICS
// ============================================================================

export async function getRevenueAnalytics(
  startDate: Date,
  endDate: Date
): Promise<{
  success: boolean;
  data?: {
    daily: Array<{ date: string; smsRevenue: number; aiRevenue: number; total: number }>;
    weekly: Array<{ week: string; smsRevenue: number; aiRevenue: number; total: number }>;
    monthly: Array<{ month: string; smsRevenue: number; aiRevenue: number; total: number }>;
    totals: {
      smsRevenue: number;
      aiRevenue: number;
      totalRevenue: number;
    };
  };
  error?: string;
}> {
  try {
    const admin = await requirePlatformAdmin();
    if (!admin) {
      return { success: false, error: 'Unauthorized' };
    }

    // Daily revenue
    const dailyRevenue = await db
      .select({
        date: sql<string>`DATE(${communicationLogs.timestamp})`,
        smsRevenue: sql<number>`COALESCE(SUM(${communicationLogs.cost}::numeric), 0)`,
      })
      .from(communicationLogs)
      .where(
        and(
          eq(communicationLogs.type, 'sms_sent'),
          gte(communicationLogs.timestamp, startDate),
          lte(communicationLogs.timestamp, endDate)
        )
      )
      .groupBy(sql`DATE(${communicationLogs.timestamp})`);

    const dailyAI = await db
      .select({
        date: sql<string>`DATE(${aiTransactions.createdAt})`,
        aiRevenue: sql<number>`COALESCE(SUM(${aiTransactions.cost}::numeric), 0)`,
      })
      .from(aiTransactions)
      .where(
        and(
          gte(aiTransactions.createdAt, startDate),
          lte(aiTransactions.createdAt, endDate)
        )
      )
      .groupBy(sql`DATE(${aiTransactions.createdAt})`);

    // Merge daily data
    const dailyMap = new Map();
    dailyRevenue.forEach((d) => {
      dailyMap.set(d.date, { date: d.date, smsRevenue: Number(d.smsRevenue), aiRevenue: 0, total: 0 });
    });
    dailyAI.forEach((d) => {
      const existing = dailyMap.get(d.date) || { date: d.date, smsRevenue: 0, aiRevenue: 0, total: 0 };
      existing.aiRevenue = Number(d.aiRevenue);
      dailyMap.set(d.date, existing);
    });
    
    const daily = Array.from(dailyMap.values()).map((d) => ({
      ...d,
      total: d.smsRevenue + d.aiRevenue,
    }));

    // Calculate totals
    const totalSMSRevenue = await db
      .select({
        total: sql<number>`COALESCE(SUM(${communicationLogs.cost}::numeric), 0)`,
      })
      .from(communicationLogs)
      .where(
        and(
          eq(communicationLogs.type, 'sms_sent'),
          gte(communicationLogs.timestamp, startDate),
          lte(communicationLogs.timestamp, endDate)
        )
      );

    const totalAIRevenue = await db
      .select({
        total: sql<number>`COALESCE(SUM(${aiTransactions.cost}::numeric), 0)`,
      })
      .from(aiTransactions)
      .where(
        and(
          gte(aiTransactions.createdAt, startDate),
          lte(aiTransactions.createdAt, endDate)
        )
      );

    const smsRevenue = Number(totalSMSRevenue[0]?.total || 0);
    const aiRevenue = Number(totalAIRevenue[0]?.total || 0);

    return {
      success: true,
      data: {
        daily,
        weekly: [], // TODO: Add weekly aggregation
        monthly: [], // TODO: Add monthly aggregation
        totals: {
          smsRevenue,
          aiRevenue,
          totalRevenue: smsRevenue + aiRevenue,
        },
      },
    };
  } catch (error) {
    console.error('❌ Error getting revenue analytics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// TOP CUSTOMERS BY USAGE
// ============================================================================

export async function getTopCustomersByUsage(
  limit: number = 10
): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    name: string;
    type: 'organization' | 'individual';
    smsCount: number;
    smsRevenue: number;
    aiTokens: number;
    aiRevenue: number;
    totalRevenue: number;
  }>;
  error?: string;
}> {
  try {
    const admin = await requirePlatformAdmin();
    if (!admin) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get top SMS users
    const topSMS = await db
      .select({
        userId: communicationLogs.userId,
        organizationId: communicationLogs.organizationId,
        smsCount: sql<number>`COUNT(*)`,
        smsRevenue: sql<number>`COALESCE(SUM(${communicationLogs.cost}::numeric), 0)`,
      })
      .from(communicationLogs)
      .where(eq(communicationLogs.type, 'sms_sent'))
      .groupBy(communicationLogs.userId, communicationLogs.organizationId)
      .orderBy(desc(sql`COALESCE(SUM(${communicationLogs.cost}::numeric), 0)`))
      .limit(limit);

    // Get top AI users
    const topAI = await db
      .select({
        userId: aiTransactions.userId,
        organizationId: aiTransactions.organizationId,
        aiTokens: sql<number>`COALESCE(SUM(${aiTransactions.totalTokens}), 0)`,
        aiRevenue: sql<number>`COALESCE(SUM(${aiTransactions.cost}::numeric), 0)`,
      })
      .from(aiTransactions)
      .groupBy(aiTransactions.userId, aiTransactions.organizationId)
      .orderBy(desc(sql`COALESCE(SUM(${aiTransactions.cost}::numeric), 0)`))
      .limit(limit);

    // Merge and enrich with customer names
    const customerMap = new Map();

    for (const sms of topSMS) {
      const targetId = sms.organizationId || sms.userId;
      const type = sms.organizationId ? 'organization' : 'individual';
      
      if (!customerMap.has(targetId)) {
        let name = '';
        if (type === 'organization') {
          const org = await db.query.organizations.findFirst({
            where: eq(organizations.id, targetId!),
          });
          name = org?.name || 'Unknown';
        } else {
          const user = await db.query.users.findFirst({
            where: eq(users.id, targetId!),
          });
          name = user?.fullName || user?.email || 'Unknown';
        }

        customerMap.set(targetId, {
          id: targetId,
          name,
          type,
          smsCount: 0,
          smsRevenue: 0,
          aiTokens: 0,
          aiRevenue: 0,
          totalRevenue: 0,
        });
      }

      const customer = customerMap.get(targetId);
      customer.smsCount = Number(sms.smsCount);
      customer.smsRevenue = Number(sms.smsRevenue);
      customer.totalRevenue += customer.smsRevenue;
    }

    for (const ai of topAI) {
      const targetId = ai.organizationId || ai.userId;
      const type = ai.organizationId ? 'organization' : 'individual';

      if (!customerMap.has(targetId)) {
        let name = '';
        if (type === 'organization') {
          const org = await db.query.organizations.findFirst({
            where: eq(organizations.id, targetId!),
          });
          name = org?.name || 'Unknown';
        } else {
          const user = await db.query.users.findFirst({
            where: eq(users.id, targetId!),
          });
          name = user?.fullName || user?.email || 'Unknown';
        }

        customerMap.set(targetId, {
          id: targetId,
          name,
          type,
          smsCount: 0,
          smsRevenue: 0,
          aiTokens: 0,
          aiRevenue: 0,
          totalRevenue: 0,
        });
      }

      const customer = customerMap.get(targetId);
      customer.aiTokens = Number(ai.aiTokens);
      customer.aiRevenue = Number(ai.aiRevenue);
      customer.totalRevenue += customer.aiRevenue;
    }

    const customers = Array.from(customerMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    return { success: true, data: customers };
  } catch (error) {
    console.error('❌ Error getting top customers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// CHURN ANALYSIS
// ============================================================================

export async function getChurnAnalysis(): Promise<{
  success: boolean;
  data?: {
    activeCustomers: number;
    inactiveCustomers: number;
    churnRate: number;
    recentlyInactive: Array<{
      id: string;
      name: string;
      type: 'organization' | 'individual';
      lastActivity: Date;
      daysSinceActivity: number;
    }>;
  };
  error?: string;
}> {
  try {
    const admin = await requirePlatformAdmin();
    if (!admin) {
      return { success: false, error: 'Unauthorized' };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get customers with recent activity
    const activeUsers = await db
      .selectDistinct({ userId: communicationLogs.userId })
      .from(communicationLogs)
      .where(gte(communicationLogs.timestamp, thirtyDaysAgo));

    const activeOrgs = await db
      .selectDistinct({ orgId: communicationLogs.organizationId })
      .from(communicationLogs)
      .where(
        and(
          gte(communicationLogs.timestamp, thirtyDaysAgo),
          sql`${communicationLogs.organizationId} IS NOT NULL`
        )
      );

    const totalUsers = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`organization_id IS NULL`);

    const totalOrgs = await db
      .select({ count: sql<number>`count(*)` })
      .from(organizations);

    const totalCustomers = Number(totalUsers[0]?.count || 0) + Number(totalOrgs[0]?.count || 0);
    const activeCustomers = activeUsers.length + activeOrgs.length;
    const inactiveCustomers = totalCustomers - activeCustomers;
    const churnRate = totalCustomers > 0 ? (inactiveCustomers / totalCustomers) * 100 : 0;

    return {
      success: true,
      data: {
        activeCustomers,
        inactiveCustomers,
        churnRate,
        recentlyInactive: [], // TODO: Get recently inactive customers
      },
    };
  } catch (error) {
    console.error('❌ Error getting churn analysis:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// USAGE TRENDS
// ============================================================================

export async function getUsageTrends(days: number = 30): Promise<{
  success: boolean;
  data?: {
    smsGrowth: number;
    aiGrowth: number;
    customerGrowth: number;
    revenueGrowth: number;
  };
  error?: string;
}> {
  try {
    const admin = await requirePlatformAdmin();
    if (!admin) {
      return { success: false, error: 'Unauthorized' };
    }

    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - days);
    const previousPeriodStart = new Date(periodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days);

    // Current period SMS
    const currentSMS = await db
      .select({ count: sql<number>`count(*)` })
      .from(communicationLogs)
      .where(
        and(
          eq(communicationLogs.type, 'sms_sent'),
          gte(communicationLogs.timestamp, periodStart)
        )
      );

    // Previous period SMS
    const previousSMS = await db
      .select({ count: sql<number>`count(*)` })
      .from(communicationLogs)
      .where(
        and(
          eq(communicationLogs.type, 'sms_sent'),
          gte(communicationLogs.timestamp, previousPeriodStart),
          lte(communicationLogs.timestamp, periodStart)
        )
      );

    const currentSMSCount = Number(currentSMS[0]?.count || 0);
    const previousSMSCount = Number(previousSMS[0]?.count || 0);
    const smsGrowth = previousSMSCount > 0
      ? ((currentSMSCount - previousSMSCount) / previousSMSCount) * 100
      : 0;

    return {
      success: true,
      data: {
        smsGrowth,
        aiGrowth: 0, // TODO: Calculate AI growth
        customerGrowth: 0, // TODO: Calculate customer growth
        revenueGrowth: 0, // TODO: Calculate revenue growth
      },
    };
  } catch (error) {
    console.error('❌ Error getting usage trends:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

