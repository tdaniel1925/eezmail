'use server';

import { db } from '@/lib/db';
import { users, betaAnalytics } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendBetaCreditsLowEmail, sendBetaCreditsExhaustedEmail } from './email-sender';

export interface BetaCredits {
  sms_limit: number;
  sms_used: number;
  ai_limit: number;
  ai_used: number;
  reset_date: string; // ISO date string
}

export interface CreditCheckResult {
  hasAccess: boolean;
  remaining: number;
  limit: number;
  percentUsed: number;
}

/**
 * Check if user has SMS credits available
 */
export async function checkSMSCredits(userId: string): Promise<CreditCheckResult> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user || user.accountType !== 'beta') {
    return { hasAccess: false, remaining: 0, limit: 0, percentUsed: 100 };
  }

  const credits = user.betaCredits as BetaCredits | null;
  if (!credits) {
    return { hasAccess: false, remaining: 0, limit: 0, percentUsed: 100 };
  }

  const remaining = credits.sms_limit - credits.sms_used;
  const percentUsed = (credits.sms_used / credits.sms_limit) * 100;

  return {
    hasAccess: remaining > 0,
    remaining,
    limit: credits.sms_limit,
    percentUsed,
  };
}

/**
 * Check if user has AI credits available
 */
export async function checkAICredits(userId: string): Promise<CreditCheckResult> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user || user.accountType !== 'beta') {
    return { hasAccess: false, remaining: 0, limit: 0, percentUsed: 100 };
  }

  const credits = user.betaCredits as BetaCredits | null;
  if (!credits) {
    return { hasAccess: false, remaining: 0, limit: 0, percentUsed: 100 };
  }

  const remaining = credits.ai_limit - credits.ai_used;
  const percentUsed = (credits.ai_used / credits.ai_limit) * 100;

  return {
    hasAccess: remaining > 0,
    remaining,
    limit: credits.ai_limit,
    percentUsed,
  };
}

/**
 * Deduct SMS credit from user
 */
export async function deductSMSCredit(
  userId: string,
  amount: number = 1
): Promise<{ success: boolean; remaining: number }> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user || user.accountType !== 'beta') {
    return { success: false, remaining: 0 };
  }

  const credits = user.betaCredits as BetaCredits | null;
  if (!credits || credits.sms_used + amount > credits.sms_limit) {
    return { success: false, remaining: credits ? credits.sms_limit - credits.sms_used : 0 };
  }

  const newCredits: BetaCredits = {
    ...credits,
    sms_used: credits.sms_used + amount,
  };

  await db.update(users).set({ betaCredits: newCredits }).where(eq(users.id, userId));

  // Track usage
  await db.insert(betaAnalytics).values({
    userId,
    eventType: 'sms_sent',
    eventData: { amount, remaining: newCredits.sms_limit - newCredits.sms_used },
  });

  const remaining = newCredits.sms_limit - newCredits.sms_used;
  const percentUsed = (newCredits.sms_used / newCredits.sms_limit) * 100;

  // Send warning email at 80% usage
  if (percentUsed >= 80 && percentUsed < 100) {
    await sendBetaCreditsLowEmail(userId, 'sms', remaining, newCredits.sms_limit);
  }

  // Send exhausted email at 100% usage
  if (percentUsed >= 100) {
    await sendBetaCreditsExhaustedEmail(userId, 'sms');
  }

  return { success: true, remaining };
}

/**
 * Deduct AI credit from user
 */
export async function deductAICredit(
  userId: string,
  amount: number = 1
): Promise<{ success: boolean; remaining: number }> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user || user.accountType !== 'beta') {
    return { success: false, remaining: 0 };
  }

  const credits = user.betaCredits as BetaCredits | null;
  if (!credits || credits.ai_used + amount > credits.ai_limit) {
    return { success: false, remaining: credits ? credits.ai_limit - credits.ai_used : 0 };
  }

  const newCredits: BetaCredits = {
    ...credits,
    ai_used: credits.ai_used + amount,
  };

  await db.update(users).set({ betaCredits: newCredits }).where(eq(users.id, userId));

  // Track usage
  await db.insert(betaAnalytics).values({
    userId,
    eventType: 'ai_used',
    eventData: { amount, remaining: newCredits.ai_limit - newCredits.ai_used },
  });

  const remaining = newCredits.ai_limit - newCredits.ai_used;
  const percentUsed = (newCredits.ai_used / newCredits.ai_limit) * 100;

  // Send warning email at 80% usage
  if (percentUsed >= 80 && percentUsed < 100) {
    await sendBetaCreditsLowEmail(userId, 'ai', remaining, newCredits.ai_limit);
  }

  // Send exhausted email at 100% usage
  if (percentUsed >= 100) {
    await sendBetaCreditsExhaustedEmail(userId, 'ai');
  }

  return { success: true, remaining };
}

/**
 * Reset credits for a user (monthly reset)
 */
export async function resetUserCredits(userId: string): Promise<{ success: boolean }> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user || user.accountType !== 'beta') {
    return { success: false };
  }

  const credits = user.betaCredits as BetaCredits | null;
  if (!credits) {
    return { success: false };
  }

  // Calculate next reset date (one month from now)
  const nextResetDate = new Date();
  nextResetDate.setMonth(nextResetDate.getMonth() + 1);

  const resetCredits: BetaCredits = {
    ...credits,
    sms_used: 0,
    ai_used: 0,
    reset_date: nextResetDate.toISOString(),
  };

  await db.update(users).set({ betaCredits: resetCredits }).where(eq(users.id, userId));

  // Track reset event
  await db.insert(betaAnalytics).values({
    userId,
    eventType: 'credits_reset',
    eventData: { reset_date: nextResetDate.toISOString() },
  });

  return { success: true };
}

/**
 * Check if credits need to be reset (past reset date)
 */
export async function checkAndResetCredits(userId: string): Promise<void> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user || user.accountType !== 'beta') {
    return;
  }

  const credits = user.betaCredits as BetaCredits | null;
  if (!credits || !credits.reset_date) {
    return;
  }

  const resetDate = new Date(credits.reset_date);
  const now = new Date();

  // If past reset date, reset credits
  if (now >= resetDate) {
    await resetUserCredits(userId);
  }
}

/**
 * Calculate days until beta expiration
 */
export async function getDaysUntilExpiration(userId: string): Promise<number | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user || !user.betaExpiresAt) {
    return null;
  }

  const now = new Date();
  const expiresAt = new Date(user.betaExpiresAt);
  const diffTime = expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}

/**
 * Get complete credit status for a user
 */
export async function getCreditStatus(userId: string) {
  const smsCredits = await checkSMSCredits(userId);
  const aiCredits = await checkAICredits(userId);
  const daysUntilExpiration = await getDaysUntilExpiration(userId);

  return {
    sms: smsCredits,
    ai: aiCredits,
    daysUntilExpiration,
  };
}

