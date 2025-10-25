/**
 * SMS Billing & Pricing Logic
 * Multi-tenant SaaS with flexible pricing
 */

import { db } from '@/lib/db';
import { 
  users, 
  organizations, 
  organizationMembers,
  pricingOverrides,
  trialCredits,
  customerSubscriptions,
  subscriptionPlans,
  platformSettings,
  communicationLogs,
} from '@/db/schema';
import { eq, and, gte, lte, or, isNull } from 'drizzle-orm';

// ============================================================================
// PRICING LOGIC
// ============================================================================

/**
 * Get SMS rate for a user
 * Priority: Override > Subscription > Tier > Global Default
 */
export async function getSMSRate(userId: string): Promise<number> {
  try {
    // 1. Determine if user is individual or part of organization
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) throw new Error('User not found');

    const targetId = user.organizationId || userId;
    const targetType: 'organization' | 'user' = user.organizationId ? 'organization' : 'user';

    // 2. Check for active pricing override
    const now = new Date();
    const override = await db.query.pricingOverrides.findFirst({
      where: and(
        targetType === 'organization'
          ? eq(pricingOverrides.organizationId, targetId)
          : eq(pricingOverrides.userId, targetId),
        lte(pricingOverrides.effectiveFrom, now),
        or(
          isNull(pricingOverrides.effectiveUntil),
          gte(pricingOverrides.effectiveUntil, now)
        )
      ),
      orderBy: (overrides, { desc }) => [desc(overrides.effectiveFrom)],
    });

    if (override) {
      console.log(`💰 Using pricing override for ${targetType} ${targetId}: $${override.smsRate}`);
      return Number(override.smsRate);
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

    if (subscription) {
      // Check if within included SMS quota
      if (
        subscription.smsUsedCurrentPeriod < subscription.smsIncludedInPlan &&
        subscription.smsIncludedInPlan > 0
      ) {
        console.log(`💰 SMS included in plan (${subscription.smsUsedCurrentPeriod}/${subscription.smsIncludedInPlan})`);
        return 0; // Free (included in plan)
      }

      // Use overage rate
      if (subscription.plan?.overageRate) {
        console.log(`💰 Using plan overage rate: $${subscription.plan.overageRate}`);
        return Number(subscription.plan.overageRate);
      }
    }

    // 4. Check tier-based pricing
    const tierRates: Record<string, number> = {
      standard: 0.0100,
      volume: 0.0085,
      enterprise: 0.0075,
      partner: 0.0050,
    };

    const tier = targetType === 'organization'
      ? (await db.query.organizations.findFirst({
          where: eq(organizations.id, targetId),
        }))?.pricingTier
      : user.pricingTier;

    if (tier && tierRates[tier]) {
      console.log(`💰 Using tier rate (${tier}): $${tierRates[tier]}`);
      return tierRates[tier];
    }

    // 5. Global default rate
    const defaultSetting = await db.query.platformSettings.findFirst({
      where: eq(platformSettings.key, 'sms_pricing_default'),
    });

    const defaultRate = defaultSetting?.value?.rate || 0.0100;
    console.log(`💰 Using global default rate: $${defaultRate}`);
    return Number(defaultRate);
  } catch (error) {
    console.error('❌ Error getting SMS rate:', error);
    return 0.0100; // Fallback to $0.01
  }
}

// ============================================================================
// BILLING & CHARGING
// ============================================================================

export interface ChargeResult {
  success: boolean;
  chargedFrom: 'trial' | 'subscription' | 'balance' | 'failed';
  amount: number;
  remainingBalance?: number;
  error?: string;
}

/**
 * Charge SMS with trial credit check
 * Routing: Organization member → Bill organization
 *          Individual user → Bill user
 */
export async function chargeSMS(
  userId: string,
  cost: number,
  metadata?: {
    messageSid?: string;
    contactId?: string;
    phoneNumber?: string;
  }
): Promise<ChargeResult> {
  try {
    // 1. Get user and determine billing target
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return { success: false, chargedFrom: 'failed', amount: 0, error: 'User not found' };
    }

    const billedTo = user.organizationId || userId;
    const billedToType: 'organization' | 'user' = user.organizationId ? 'organization' : 'user';

    console.log(`💳 Billing SMS ($${cost}) to ${billedToType}: ${billedTo}`);

    // 2. Check active trial credits
    const trial = await getActiveTrial(billedTo, billedToType);
    if (trial && Number(trial.remainingBalance) >= cost) {
      // Deduct from trial credits
      const newBalance = Number(trial.remainingBalance) - cost;
      await db
        .update(trialCredits)
        .set({
          remainingBalance: newBalance.toFixed(2),
        })
        .where(eq(trialCredits.id, trial.id));

      // Update organization/user trial usage
      if (billedToType === 'organization') {
        const org = await db.query.organizations.findFirst({
          where: eq(organizations.id, billedTo),
        });
        await db
          .update(organizations)
          .set({
            trialCreditsUsed: (Number(org?.trialCreditsUsed || 0) + cost).toFixed(2),
          })
          .where(eq(organizations.id, billedTo));
      } else {
        await db
          .update(users)
          .set({
            trialCreditsUsed: (Number(user.trialCreditsUsed || 0) + cost).toFixed(2),
          })
          .where(eq(users.id, billedTo));
      }

      console.log(`✅ Charged $${cost} from trial credits. Remaining: $${newBalance.toFixed(2)}`);

      // Log the transaction
      await logSMSTransaction(userId, billedTo, billedToType, cost, 'trial', metadata);

      return {
        success: true,
        chargedFrom: 'trial',
        amount: cost,
        remainingBalance: newBalance,
      };
    }

    // 3. Check subscription (if SMS included in plan)
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
      subscription.smsUsedCurrentPeriod < subscription.smsIncludedInPlan &&
      cost === 0 // SMS was free (from getSMSRate)
    ) {
      // Increment SMS usage counter
      await db
        .update(customerSubscriptions)
        .set({
          smsUsedCurrentPeriod: subscription.smsUsedCurrentPeriod + 1,
        })
        .where(eq(customerSubscriptions.id, subscription.id));

      console.log(`✅ SMS included in plan (${subscription.smsUsedCurrentPeriod + 1}/${subscription.smsIncludedInPlan})`);

      await logSMSTransaction(userId, billedTo, billedToType, cost, 'subscription', metadata);

      return {
        success: true,
        chargedFrom: 'subscription',
        amount: 0,
      };
    }

    // 4. Charge balance (for individual users)
    if (billedToType === 'user') {
      if (Number(user.smsBalance || 0) < cost) {
        return {
          success: false,
          chargedFrom: 'failed',
          amount: cost,
          error: 'Insufficient balance',
        };
      }

      const newBalance = Number(user.smsBalance || 0) - cost;
      await db
        .update(users)
        .set({
          smsBalance: newBalance.toFixed(2),
        })
        .where(eq(users.id, billedTo));

      console.log(`✅ Charged $${cost} from user balance. Remaining: $${newBalance.toFixed(2)}`);

      await logSMSTransaction(userId, billedTo, billedToType, cost, 'balance', metadata);

      return {
        success: true,
        chargedFrom: 'balance',
        amount: cost,
        remainingBalance: newBalance,
      };
    }

    // 5. For organizations, bill via Stripe/Square (future implementation)
    // For now, just log and mark as charged
    console.log(`✅ Charged $${cost} to organization ${billedTo} (will bill via Stripe/Square)`);

    await logSMSTransaction(userId, billedTo, billedToType, cost, 'balance', metadata);

    return {
      success: true,
      chargedFrom: 'balance',
      amount: cost,
    };
  } catch (error) {
    console.error('❌ Error charging SMS:', error);
    return {
      success: false,
      chargedFrom: 'failed',
      amount: cost,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// TRIAL CREDITS
// ============================================================================

/**
 * Get active trial credits for organization or user
 */
async function getActiveTrial(
  targetId: string,
  targetType: 'organization' | 'user'
): Promise<typeof trialCredits.$inferSelect | undefined> {
  const now = new Date();
  return await db.query.trialCredits.findFirst({
    where: and(
      targetType === 'organization'
        ? eq(trialCredits.organizationId, targetId)
        : eq(trialCredits.userId, targetId),
      eq(trialCredits.status, 'active'),
      gte(trialCredits.expiresAt, now)
    ),
  });
}

/**
 * Grant trial credits (admin action)
 */
export async function grantTrialCredits(
  targetId: string,
  targetType: 'organization' | 'user',
  amount: number,
  durationDays: number,
  grantedBy: string,
  reason?: string
): Promise<{ success: boolean; trialId?: string; error?: string }> {
  try {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const [trial] = await db
      .insert(trialCredits)
      .values({
        organizationId: targetType === 'organization' ? targetId : null,
        userId: targetType === 'user' ? targetId : null,
        creditAmount: amount.toFixed(2),
        durationDays,
        status: 'active',
        startedAt: now,
        expiresAt,
        remainingBalance: amount.toFixed(2),
        grantedBy,
        reason,
      })
      .returning();

    // Update organization/user trial status
    if (targetType === 'organization') {
      await db
        .update(organizations)
        .set({
          isTrial: true,
          trialExpiresAt: expiresAt,
        })
        .where(eq(organizations.id, targetId));
    } else {
      await db
        .update(users)
        .set({
          isTrial: true,
          trialExpiresAt: expiresAt,
        })
        .where(eq(users.id, targetId));
    }

    console.log(`✅ Granted $${amount} trial credits to ${targetType} ${targetId} for ${durationDays} days`);

    return { success: true, trialId: trial.id };
  } catch (error) {
    console.error('❌ Error granting trial credits:', error);
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
 * Log SMS transaction for billing tracking
 */
async function logSMSTransaction(
  userId: string,
  billedTo: string,
  billedToType: 'organization' | 'user',
  cost: number,
  chargedFrom: string,
  metadata?: {
    messageSid?: string;
    contactId?: string;
    phoneNumber?: string;
  }
): Promise<void> {
  try {
    await db.insert(communicationLogs).values({
      userId,
      organizationId: billedToType === 'organization' ? billedTo : null,
      contactId: metadata?.contactId,
      type: 'sms_sent',
      direction: 'outbound',
      status: 'completed',
      billedTo: billedToType,
      cost: cost.toFixed(4),
      billingStatus: 'charged',
      metadata: {
        messageSid: metadata?.messageSid,
        phoneNumber: metadata?.phoneNumber,
        chargedFrom,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('❌ Error logging SMS transaction:', error);
  }
}

// ============================================================================
// BALANCE MANAGEMENT
// ============================================================================

/**
 * Add balance to user account (for individual pay-as-you-go)
 */
export async function addBalance(
  userId: string,
  amount: number
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const newBalance = Number(user.smsBalance || 0) + amount;

    await db
      .update(users)
      .set({
        smsBalance: newBalance.toFixed(2),
      })
      .where(eq(users.id, userId));

    console.log(`✅ Added $${amount} to user ${userId}. New balance: $${newBalance.toFixed(2)}`);

    return { success: true, newBalance };
  } catch (error) {
    console.error('❌ Error adding balance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get balance for user or organization
 */
export async function getBalance(
  userId: string
): Promise<{
  balance: number;
  trialCredits: number;
  subscriptionSMSRemaining: number;
  billingTarget: 'user' | 'organization';
  billingTargetId: string;
}> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return {
        balance: 0,
        trialCredits: 0,
        subscriptionSMSRemaining: 0,
        billingTarget: 'user',
        billingTargetId: userId,
      };
    }

    const billingTarget: 'user' | 'organization' = user.organizationId ? 'organization' : 'user';
    const billingTargetId = user.organizationId || userId;

    // Get trial credits
    const trial = await getActiveTrial(billingTargetId, billingTarget);
    const trialCredits = trial ? Number(trial.remainingBalance) : 0;

    // Get subscription SMS remaining
    const subscription = await db.query.customerSubscriptions.findFirst({
      where: and(
        billingTarget === 'organization'
          ? eq(customerSubscriptions.organizationId, billingTargetId)
          : eq(customerSubscriptions.userId, billingTargetId),
        eq(customerSubscriptions.status, 'active')
      ),
    });

    const subscriptionSMSRemaining = subscription
      ? Math.max(0, subscription.smsIncludedInPlan - subscription.smsUsedCurrentPeriod)
      : 0;

    // Get balance
    const balance = billingTarget === 'user' ? Number(user.smsBalance || 0) : 0;

    return {
      balance,
      trialCredits,
      subscriptionSMSRemaining,
      billingTarget,
      billingTargetId,
    };
  } catch (error) {
    console.error('❌ Error getting balance:', error);
    return {
      balance: 0,
      trialCredits: 0,
      subscriptionSMSRemaining: 0,
      billingTarget: 'user',
      billingTargetId: userId,
    };
  }
}

