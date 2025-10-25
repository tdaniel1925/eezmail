/**
 * AI Credits Billing & Pricing Logic
 * Tracks OpenAI/AI usage and billing
 */

import { db } from '@/db';
import {
  users,
  organizations,
  aiPricingOverrides,
  aiTrialCredits,
  customerSubscriptions,
  subscriptionPlans,
  platformSettings,
  aiTransactions,
} from '@/db/schema';
import { eq, and, gte, lte, or, isNull } from 'drizzle-orm';

// ============================================================================
// AI PRICING LOGIC
// ============================================================================

/**
 * Get AI rate per 1000 tokens for a user
 * Priority: Override > Subscription > Global Default
 */
export async function getAIRate(userId: string): Promise<number> {
  try {
    // 1. Determine if user is individual or part of organization
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) throw new Error('User not found');

    const targetId = user.organizationId || userId;
    const targetType: 'organization' | 'user' = user.organizationId
      ? 'organization'
      : 'user';

    // 2. Check for active pricing override
    const now = new Date();
    const override = await db.query.aiPricingOverrides.findFirst({
      where: and(
        targetType === 'organization'
          ? eq(aiPricingOverrides.organizationId, targetId)
          : eq(aiPricingOverrides.userId, targetId),
        lte(aiPricingOverrides.effectiveFrom, now),
        or(
          isNull(aiPricingOverrides.effectiveUntil),
          gte(aiPricingOverrides.effectiveUntil, now)
        )
      ),
      orderBy: (overrides, { desc }) => [desc(overrides.effectiveFrom)],
    });

    if (override) {
      console.log(
        `🤖 Using AI pricing override for ${targetType} ${targetId}: $${override.ratePer1kTokens}/1k tokens`
      );
      return Number(override.ratePer1kTokens);
    }

    // 3. Check subscription plan
    const subscription = await db.query.customerSubscriptions.findFirst({
      where: and(
        targetType === 'organization'
          ? eq(customerSubscriptions.organizationId, targetId)
          : eq(customerSubscriptions.userId, targetId),
        eq(customerSubscriptions.status, 'active')
      ),
      with: {
        plan: true,
      },
    });

    if (subscription?.plan?.aiOverageRate) {
      console.log(
        `🤖 Using plan AI rate: $${subscription.plan.aiOverageRate}/1k tokens`
      );
      return Number(subscription.plan.aiOverageRate);
    }

    // 4. Global default rate
    const defaultSetting = await db.query.platformSettings.findFirst({
      where: eq(platformSettings.key, 'ai_pricing_default'),
    });

    const defaultRate = defaultSetting?.value?.rate_per_1k_tokens || 0.002;
    console.log(`🤖 Using global AI rate: $${defaultRate}/1k tokens`);
    return Number(defaultRate);
  } catch (error) {
    console.error('❌ Error getting AI rate:', error);
    return 0.002; // Fallback to $0.002/1k tokens
  }
}

// ============================================================================
// AI BILLING & CHARGING
// ============================================================================

export interface AIChargeResult {
  success: boolean;
  chargedFrom: 'trial' | 'subscription' | 'balance' | 'failed';
  amount: number;
  tokens: number;
  remainingBalance?: number;
  error?: string;
}

/**
 * Calculate cost for AI tokens
 */
export function calculateAICost(tokens: number, ratePer1k: number): number {
  return (tokens / 1000) * ratePer1k;
}

/**
 * Charge for AI usage with trial credit check
 * Routing: Organization member → Bill organization
 *          Individual user → Bill user
 */
export async function chargeAI(
  userId: string,
  tokens: number,
  feature: string,
  model: string = 'gpt-4o-mini',
  metadata?: {
    emailId?: string;
    threadId?: string;
    promptTokens?: number;
    completionTokens?: number;
  }
): Promise<AIChargeResult> {
  try {
    // 1. Get user and determine billing target
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return {
        success: false,
        chargedFrom: 'failed',
        amount: 0,
        tokens,
        error: 'User not found',
      };
    }

    const billedTo = user.organizationId || userId;
    const billedToType: 'organization' | 'user' = user.organizationId
      ? 'organization'
      : 'user';

    // 2. Get AI rate and calculate cost
    const ratePer1k = await getAIRate(userId);
    const cost = calculateAICost(tokens, ratePer1k);

    console.log(
      `🤖 Billing AI (${tokens} tokens, $${cost}) to ${billedToType}: ${billedTo}`
    );

    // 3. Check active AI trial credits
    const trial = await getActiveAITrial(billedTo, billedToType);
    if (trial) {
      const remainingBalance = Number(trial.remainingBalance);
      const tokensRemaining = trial.tokensIncluded
        ? trial.tokensIncluded - (trial.tokensUsed || 0)
        : Infinity;

      // Check if trial has enough tokens and balance
      if (tokensRemaining >= tokens && remainingBalance >= cost) {
        // Deduct from trial credits
        const newBalance = remainingBalance - cost;
        const newTokensUsed = (trial.tokensUsed || 0) + tokens;

        await db
          .update(aiTrialCredits)
          .set({
            remainingBalance: newBalance.toFixed(2),
            tokensUsed: newTokensUsed,
          })
          .where(eq(aiTrialCredits.id, trial.id));

        console.log(
          `✅ Charged $${cost} (${tokens} tokens) from AI trial credits. Remaining: $${newBalance.toFixed(2)}`
        );

        await logAITransaction(
          userId,
          billedTo,
          billedToType,
          tokens,
          cost,
          feature,
          model,
          'trial',
          metadata
        );

        return {
          success: true,
          chargedFrom: 'trial',
          amount: cost,
          tokens,
          remainingBalance: newBalance,
        };
      }
    }

    // 4. Check subscription (if AI tokens included in plan)
    const subscription = await db.query.customerSubscriptions.findFirst({
      where: and(
        billedToType === 'organization'
          ? eq(customerSubscriptions.organizationId, billedTo)
          : eq(customerSubscriptions.userId, billedTo),
        eq(customerSubscriptions.status, 'active')
      ),
    });

    if (
      subscription &&
      subscription.aiTokensUsedCurrentPeriod < subscription.aiTokensIncludedInPlan
    ) {
      const tokensRemaining =
        subscription.aiTokensIncludedInPlan -
        subscription.aiTokensUsedCurrentPeriod;

      if (tokensRemaining >= tokens) {
        // Increment AI tokens usage counter
        await db
          .update(customerSubscriptions)
          .set({
            aiTokensUsedCurrentPeriod:
              subscription.aiTokensUsedCurrentPeriod + tokens,
          })
          .where(eq(customerSubscriptions.id, subscription.id));

        console.log(
          `✅ AI tokens included in plan (${subscription.aiTokensUsedCurrentPeriod + tokens}/${subscription.aiTokensIncludedInPlan})`
        );

        await logAITransaction(
          userId,
          billedTo,
          billedToType,
          tokens,
          0, // No cost (included in plan)
          feature,
          model,
          'subscription',
          metadata
        );

        return {
          success: true,
          chargedFrom: 'subscription',
          amount: 0,
          tokens,
        };
      }
    }

    // 5. Charge balance
    if (billedToType === 'user') {
      // Individual user balance
      if (Number(user.aiBalance || 0) < cost) {
        return {
          success: false,
          chargedFrom: 'failed',
          amount: cost,
          tokens,
          error: 'Insufficient AI balance',
        };
      }

      const newBalance = Number(user.aiBalance || 0) - cost;
      await db
        .update(users)
        .set({
          aiBalance: newBalance.toFixed(2),
          aiTokensUsed: (user.aiTokensUsed || 0) + tokens,
        })
        .where(eq(users.id, billedTo));

      console.log(
        `✅ Charged $${cost} from user AI balance. Remaining: $${newBalance.toFixed(2)}`
      );

      await logAITransaction(
        userId,
        billedTo,
        billedToType,
        tokens,
        cost,
        feature,
        model,
        'balance',
        metadata
      );

      return {
        success: true,
        chargedFrom: 'balance',
        amount: cost,
        tokens,
        remainingBalance: newBalance,
      };
    } else {
      // Organization balance
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, billedTo),
      });

      if (!org || Number(org.aiBalance || 0) < cost) {
        return {
          success: false,
          chargedFrom: 'failed',
          amount: cost,
          tokens,
          error: 'Insufficient organization AI balance',
        };
      }

      const newBalance = Number(org.aiBalance || 0) - cost;
      await db
        .update(organizations)
        .set({
          aiBalance: newBalance.toFixed(2),
          aiTokensUsed: (org.aiTokensUsed || 0) + tokens,
        })
        .where(eq(organizations.id, billedTo));

      console.log(
        `✅ Charged $${cost} from organization AI balance. Remaining: $${newBalance.toFixed(2)}`
      );

      await logAITransaction(
        userId,
        billedTo,
        billedToType,
        tokens,
        cost,
        feature,
        model,
        'balance',
        metadata
      );

      return {
        success: true,
        chargedFrom: 'balance',
        amount: cost,
        tokens,
        remainingBalance: newBalance,
      };
    }
  } catch (error) {
    console.error('❌ Error charging AI:', error);
    return {
      success: false,
      chargedFrom: 'failed',
      amount: 0,
      tokens,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// AI TRIAL CREDITS
// ============================================================================

/**
 * Get active AI trial credits for organization or user
 */
async function getActiveAITrial(
  targetId: string,
  targetType: 'organization' | 'user'
): Promise<typeof aiTrialCredits.$inferSelect | undefined> {
  const now = new Date();
  return await db.query.aiTrialCredits.findFirst({
    where: and(
      targetType === 'organization'
        ? eq(aiTrialCredits.organizationId, targetId)
        : eq(aiTrialCredits.userId, targetId),
      eq(aiTrialCredits.status, 'active'),
      gte(aiTrialCredits.expiresAt, now)
    ),
  });
}

/**
 * Grant AI trial credits (admin action)
 */
export async function grantAITrialCredits(
  targetId: string,
  targetType: 'organization' | 'user',
  amount: number,
  tokensIncluded: number,
  durationDays: number,
  grantedBy: string,
  reason?: string
): Promise<{ success: boolean; trialId?: string; error?: string }> {
  try {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const [trial] = await db
      .insert(aiTrialCredits)
      .values({
        organizationId: targetType === 'organization' ? targetId : null,
        userId: targetType === 'user' ? targetId : null,
        creditAmount: amount.toFixed(2),
        tokensIncluded,
        durationDays,
        status: 'active',
        startedAt: now,
        expiresAt,
        remainingBalance: amount.toFixed(2),
        tokensUsed: 0,
        grantedBy,
        reason,
      })
      .returning();

    console.log(
      `✅ Granted $${amount} (${tokensIncluded} tokens) AI trial credits to ${targetType} ${targetId} for ${durationDays} days`
    );

    return { success: true, trialId: trial.id };
  } catch (error) {
    console.error('❌ Error granting AI trial credits:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// TRANSACTION LOGGING
// ============================================================================

/**
 * Log AI transaction for billing tracking
 */
async function logAITransaction(
  userId: string,
  billedTo: string,
  billedToType: 'organization' | 'user',
  tokens: number,
  cost: number,
  feature: string,
  model: string,
  chargedFrom: string,
  metadata?: {
    emailId?: string;
    threadId?: string;
    promptTokens?: number;
    completionTokens?: number;
  }
): Promise<void> {
  try {
    await db.insert(aiTransactions).values({
      userId,
      organizationId: billedToType === 'organization' ? billedTo : null,
      feature,
      model,
      promptTokens: metadata?.promptTokens || 0,
      completionTokens: metadata?.completionTokens || 0,
      totalTokens: tokens,
      cost: cost.toFixed(6),
      billedTo: billedToType,
      chargedFrom,
      emailId: metadata?.emailId,
      threadId: metadata?.threadId,
      requestMetadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
    });
  } catch (error) {
    console.error('❌ Error logging AI transaction:', error);
  }
}

// ============================================================================
// BALANCE MANAGEMENT
// ============================================================================

/**
 * Add AI balance to user or organization account
 */
export async function addAIBalance(
  targetId: string,
  targetType: 'organization' | 'user',
  amount: number
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    if (targetType === 'user') {
      const user = await db.query.users.findFirst({
        where: eq(users.id, targetId),
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const newBalance = Number(user.aiBalance || 0) + amount;

      await db
        .update(users)
        .set({
          aiBalance: newBalance.toFixed(2),
        })
        .where(eq(users.id, targetId));

      console.log(
        `✅ Added $${amount} to user AI balance. New balance: $${newBalance.toFixed(2)}`
      );

      return { success: true, newBalance };
    } else {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, targetId),
      });

      if (!org) {
        return { success: false, error: 'Organization not found' };
      }

      const newBalance = Number(org.aiBalance || 0) + amount;

      await db
        .update(organizations)
        .set({
          aiBalance: newBalance.toFixed(2),
        })
        .where(eq(organizations.id, targetId));

      console.log(
        `✅ Added $${amount} to organization AI balance. New balance: $${newBalance.toFixed(2)}`
      );

      return { success: true, newBalance };
    }
  } catch (error) {
    console.error('❌ Error adding AI balance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get combined balance (SMS + AI)
 */
export async function getCombinedBalance(userId: string): Promise<{
  sms: {
    balance: number;
    trialCredits: number;
    subscriptionSMSRemaining: number;
  };
  ai: {
    balance: number;
    trialCredits: number;
    subscriptionTokensRemaining: number;
  };
  billingTarget: 'user' | 'organization';
  billingTargetId: string;
}> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return {
        sms: { balance: 0, trialCredits: 0, subscriptionSMSRemaining: 0 },
        ai: { balance: 0, trialCredits: 0, subscriptionTokensRemaining: 0 },
        billingTarget: 'user',
        billingTargetId: userId,
      };
    }

    const billingTarget: 'user' | 'organization' = user.organizationId
      ? 'organization'
      : 'user';
    const billingTargetId = user.organizationId || userId;

    // Get SMS trial credits
    const smsTrial = await getActiveSMSTrial(billingTargetId, billingTarget);
    const smsTrialCredits = smsTrial ? Number(smsTrial.remainingBalance) : 0;

    // Get AI trial credits
    const aiTrial = await getActiveAITrial(billingTargetId, billingTarget);
    const aiTrialCredits = aiTrial ? Number(aiTrial.remainingBalance) : 0;

    // Get subscription
    const subscription = await db.query.customerSubscriptions.findFirst({
      where: and(
        billingTarget === 'organization'
          ? eq(customerSubscriptions.organizationId, billingTargetId)
          : eq(customerSubscriptions.userId, billingTargetId),
        eq(customerSubscriptions.status, 'active')
      ),
    });

    const subscriptionSMSRemaining = subscription
      ? Math.max(
          0,
          subscription.smsIncludedInPlan - subscription.smsUsedCurrentPeriod
        )
      : 0;

    const subscriptionTokensRemaining = subscription
      ? Math.max(
          0,
          subscription.aiTokensIncludedInPlan -
            subscription.aiTokensUsedCurrentPeriod
        )
      : 0;

    // Get balances
    if (billingTarget === 'user') {
      return {
        sms: {
          balance: Number(user.smsBalance || 0),
          trialCredits: smsTrialCredits,
          subscriptionSMSRemaining,
        },
        ai: {
          balance: Number(user.aiBalance || 0),
          trialCredits: aiTrialCredits,
          subscriptionTokensRemaining,
        },
        billingTarget,
        billingTargetId,
      };
    } else {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, billingTargetId),
      });

      return {
        sms: {
          balance: Number(org?.smsBalance || 0),
          trialCredits: smsTrialCredits,
          subscriptionSMSRemaining,
        },
        ai: {
          balance: Number(org?.aiBalance || 0),
          trialCredits: aiTrialCredits,
          subscriptionTokensRemaining,
        },
        billingTarget,
        billingTargetId,
      };
    }
  } catch (error) {
    console.error('❌ Error getting combined balance:', error);
    return {
      sms: { balance: 0, trialCredits: 0, subscriptionSMSRemaining: 0 },
      ai: { balance: 0, trialCredits: 0, subscriptionTokensRemaining: 0 },
      billingTarget: 'user',
      billingTargetId: userId,
    };
  }
}

// Helper to get SMS trial (import from pricing.ts or duplicate here)
async function getActiveSMSTrial(
  targetId: string,
  targetType: 'organization' | 'user'
) {
  // This would be imported from pricing.ts in production
  // Placeholder for now
  return null;
}

