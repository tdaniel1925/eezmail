/**
 * Platform Admin Actions
 * Server actions for platform admin operations
 */

'use server';

import { db } from '@/db';
import {
  users,
  organizations,
  platformSettings,
  pricingOverrides,
  aiPricingOverrides,
  trialCredits,
  aiTrialCredits,
  communicationLogs,
  aiTransactions,
  subscriptionPlans,
  customerSubscriptions,
} from '@/db/schema';
import { eq, sql, desc, and, gte } from 'drizzle-orm';
import { requirePlatformAdmin } from './platform-middleware';
import { grantTrialCredits } from '@/lib/billing/pricing';
import { grantAITrialCredits } from '@/lib/billing/ai-pricing';

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export async function getPlatformStats(): Promise<{
  success: boolean;
  stats?: {
    totalCustomers: number;
    totalOrganizations: number;
    totalIndividuals: number;
    smsSentToday: number;
    smsSentThisMonth: number;
    aiTokensToday: number;
    aiTokensThisMonth: number;
    activeTrials: number;
    totalRevenue: number;
  };
  error?: string;
}> {
  try {
    const admin = await requirePlatformAdmin();
    if (!admin) {
      return { success: false, error: 'Unauthorized' };
    }

    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total customers
    const totalIndividuals = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`organization_id IS NULL`);

    const totalOrganizations = await db
      .select({ count: sql<number>`count(*)` })
      .from(organizations);

    // SMS stats
    const smsSentToday = await db
      .select({ count: sql<number>`count(*)` })
      .from(communicationLogs)
      .where(
        and(
          eq(communicationLogs.type, 'sms_sent'),
          gte(communicationLogs.timestamp, startOfDay)
        )
      );

    const smsSentThisMonth = await db
      .select({ count: sql<number>`count(*)` })
      .from(communicationLogs)
      .where(
        and(
          eq(communicationLogs.type, 'sms_sent'),
          gte(communicationLogs.timestamp, startOfMonth)
        )
      );

    // AI stats
    const aiStatsToday = await db
      .select({ total: sql<number>`sum(total_tokens)` })
      .from(aiTransactions)
      .where(gte(aiTransactions.createdAt, startOfDay));

    const aiStatsThisMonth = await db
      .select({ total: sql<number>`sum(total_tokens)` })
      .from(aiTransactions)
      .where(gte(aiTransactions.createdAt, startOfMonth));

    // Active trials
    const activeTrialsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(trialCredits)
      .where(
        and(eq(trialCredits.status, 'active'), gte(trialCredits.expiresAt, now))
      );

    // Revenue (from communication logs + ai transactions)
    const smsRevenue = await db
      .select({ total: sql<number>`sum(cost::numeric)` })
      .from(communicationLogs)
      .where(eq(communicationLogs.billingStatus, 'charged'));

    const aiRevenue = await db
      .select({ total: sql<number>`sum(cost::numeric)` })
      .from(aiTransactions);

    return {
      success: true,
      stats: {
        totalCustomers:
          Number(totalIndividuals[0]?.count || 0) +
          Number(totalOrganizations[0]?.count || 0),
        totalOrganizations: Number(totalOrganizations[0]?.count || 0),
        totalIndividuals: Number(totalIndividuals[0]?.count || 0),
        smsSentToday: Number(smsSentToday[0]?.count || 0),
        smsSentThisMonth: Number(smsSentThisMonth[0]?.count || 0),
        aiTokensToday: Number(aiStatsToday[0]?.total || 0),
        aiTokensThisMonth: Number(aiStatsThisMonth[0]?.total || 0),
        activeTrials: Number(activeTrialsCount[0]?.count || 0),
        totalRevenue:
          Number(smsRevenue[0]?.total || 0) + Number(aiRevenue[0]?.total || 0),
      },
    };
  } catch (error) {
    console.error('❌ Error getting platform stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// CUSTOMER MANAGEMENT
// ============================================================================

export async function getAllCustomers(): Promise<{
  success: boolean;
  customers?: Array<{
    id: string;
    name: string;
    email?: string;
    type: 'individual' | 'organization';
    smsBalance: number;
    aiBalance: number;
    smsSentCount: number;
    aiTokensUsed: number;
    isTrial: boolean;
    trialExpiresAt?: Date;
    createdAt: Date;
  }>;
  error?: string;
}> {
  try {
    const admin = await requirePlatformAdmin();
    if (!admin) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get all organizations
    const orgs = await db.query.organizations.findMany({
      orderBy: [desc(organizations.createdAt)],
    });

    // Get all individual users (no organization)
    const individualUsers = await db.query.users.findMany({
      where: sql`organization_id IS NULL`,
      orderBy: [desc(users.createdAt)],
    });

    const customers = [
      ...orgs.map((org) => ({
        id: org.id,
        name: org.name,
        type: 'organization' as const,
        smsBalance: Number(org.smsBalance || 0),
        aiBalance: Number(org.aiBalance || 0),
        smsSentCount: org.smsSentCount || 0,
        aiTokensUsed: org.aiTokensUsed || 0,
        isTrial: org.isTrial || false,
        trialExpiresAt: org.trialExpiresAt || undefined,
        createdAt: org.createdAt || new Date(),
      })),
      ...individualUsers.map((user) => ({
        id: user.id,
        name: user.fullName || user.email,
        email: user.email,
        type: 'individual' as const,
        smsBalance: Number(user.smsBalance || 0),
        aiBalance: Number(user.aiBalance || 0),
        smsSentCount: user.smsSentCount || 0,
        aiTokensUsed: user.aiTokensUsed || 0,
        isTrial: user.isTrial || false,
        trialExpiresAt: user.trialExpiresAt || undefined,
        createdAt: user.createdAt || new Date(),
      })),
    ];

    return { success: true, customers };
  } catch (error) {
    console.error('❌ Error getting customers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// PRICING MANAGEMENT
// ============================================================================

export async function setCustomSMSPricing(
  targetId: string,
  targetType: 'organization' | 'user',
  rate: number,
  reason: string,
  effectiveUntil?: Date
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await requirePlatformAdmin();
    if (!admin) {
      return { success: false, error: 'Unauthorized' };
    }

    await db.insert(pricingOverrides).values({
      organizationId: targetType === 'organization' ? targetId : null,
      userId: targetType === 'user' ? targetId : null,
      smsRate: rate.toFixed(4),
      effectiveFrom: new Date(),
      effectiveUntil: effectiveUntil || null,
      reason,
      createdBy: admin.user.id,
    });

    console.log(
      `✅ Set SMS pricing override: ${targetType} ${targetId} → $${rate}`
    );

    return { success: true };
  } catch (error) {
    console.error('❌ Error setting SMS pricing:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function setCustomAIPricing(
  targetId: string,
  targetType: 'organization' | 'user',
  ratePer1k: number,
  reason: string,
  effectiveUntil?: Date
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await requirePlatformAdmin();
    if (!admin) {
      return { success: false, error: 'Unauthorized' };
    }

    await db.insert(aiPricingOverrides).values({
      organizationId: targetType === 'organization' ? targetId : null,
      userId: targetType === 'user' ? targetId : null,
      ratePer1kTokens: ratePer1k.toFixed(6),
      effectiveFrom: new Date(),
      effectiveUntil: effectiveUntil || null,
      reason,
      createdBy: admin.user.id,
    });

    console.log(
      `✅ Set AI pricing override: ${targetType} ${targetId} → $${ratePer1k}/1k tokens`
    );

    return { success: true };
  } catch (error) {
    console.error('❌ Error setting AI pricing:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// TRIAL CREDITS MANAGEMENT
// ============================================================================

export async function grantSMSTrialCredits(
  targetId: string,
  targetType: 'organization' | 'user',
  amount: number,
  durationDays: number,
  reason: string
): Promise<{ success: boolean; trialId?: string; error?: string }> {
  try {
    const admin = await requirePlatformAdmin();
    if (!admin) {
      return { success: false, error: 'Unauthorized' };
    }

    return await grantTrialCredits(
      targetId,
      targetType,
      amount,
      durationDays,
      admin.user.id,
      reason
    );
  } catch (error) {
    console.error('❌ Error granting SMS trial credits:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function grantAITrialCreditsAction(
  targetId: string,
  targetType: 'organization' | 'user',
  amount: number,
  tokensIncluded: number,
  durationDays: number,
  reason: string
): Promise<{ success: boolean; trialId?: string; error?: string }> {
  try {
    const admin = await requirePlatformAdmin();
    if (!admin) {
      return { success: false, error: 'Unauthorized' };
    }

    return await grantAITrialCredits(
      targetId,
      targetType,
      amount,
      tokensIncluded,
      durationDays,
      admin.user.id,
      reason
    );
  } catch (error) {
    console.error('❌ Error granting AI trial credits:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// GLOBAL SETTINGS
// ============================================================================

export async function updateGlobalSMSRate(
  rate: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await requirePlatformAdmin();
    if (!admin) {
      return { success: false, error: 'Unauthorized' };
    }

    await db
      .update(platformSettings)
      .set({
        value: { rate, currency: 'USD' },
        updatedBy: admin.user.id,
        updatedAt: new Date(),
      })
      .where(eq(platformSettings.key, 'sms_pricing_default'));

    console.log(`✅ Updated global SMS rate to $${rate}`);

    return { success: true };
  } catch (error) {
    console.error('❌ Error updating global SMS rate:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function updateGlobalAIRate(
  ratePer1k: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await requirePlatformAdmin();
    if (!admin) {
      return { success: false, error: 'Unauthorized' };
    }

    await db
      .update(platformSettings)
      .set({
        value: { rate_per_1k_tokens: ratePer1k, currency: 'USD' },
        updatedBy: admin.user.id,
        updatedAt: new Date(),
      })
      .where(eq(platformSettings.key, 'ai_pricing_default'));

    console.log(`✅ Updated global AI rate to $${ratePer1k}/1k tokens`);

    return { success: true };
  } catch (error) {
    console.error('❌ Error updating global AI rate:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

