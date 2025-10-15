/**
 * Smart Sync Scheduler
 * Adaptive scheduling based on usage patterns and priorities
 */

'use server';

import { db } from '@/lib/db';
import { emailAccounts, emails } from '@/db/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';
import { queueSyncJob } from './job-queue';

export interface ScheduleConfig {
  userId: string;
  accountId: string;
  mode?: 'aggressive' | 'balanced' | 'conservative';
}

export interface SyncSchedule {
  immediate: boolean;
  nextSyncAt: Date;
  priority: 0 | 1 | 2 | 3 | 4;
  reason: string;
}

/**
 * Calculate optimal sync schedule based on account activity
 */
export async function calculateSyncSchedule(
  config: ScheduleConfig
): Promise<SyncSchedule> {
  const { accountId, mode = 'balanced' } = config;

  // Get account info
  const [account] = await db
    .select()
    .from(emailAccounts)
    .where(eq(emailAccounts.id, accountId))
    .limit(1);

  if (!account) {
    throw new Error('Account not found');
  }

  // Analyze account activity
  const activity = await analyzeAccountActivity(accountId);

  // Determine sync schedule based on activity and mode
  return determineSyncSchedule(account, activity, mode);
}

/**
 * Analyze account activity (email frequency, user engagement)
 */
async function analyzeAccountActivity(accountId: string) {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get recent email counts
  const [recentEmails] = await db
    .select({ count: sql<number>`count(*)` })
    .from(emails)
    .where(
      and(eq(emails.accountId, accountId), gte(emails.receivedAt, oneDayAgo))
    );

  const [weeklyEmails] = await db
    .select({ count: sql<number>`count(*)` })
    .from(emails)
    .where(
      and(eq(emails.accountId, accountId), gte(emails.receivedAt, oneWeekAgo))
    );

  // Get last read email time (as proxy for user activity)
  const [lastRead] = await db
    .select({ receivedAt: emails.receivedAt })
    .from(emails)
    .where(and(eq(emails.accountId, accountId), eq(emails.isRead, true)))
    .orderBy(desc(emails.receivedAt))
    .limit(1);

  const dailyEmailRate = Number(recentEmails?.count || 0);
  const weeklyEmailRate = Number(weeklyEmails?.count || 0);
  const averageDailyRate = weeklyEmailRate / 7;

  const lastActivity = lastRead?.receivedAt || null;
  const hoursSinceActivity = lastActivity
    ? (now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60)
    : null;

  return {
    dailyEmailRate,
    weeklyEmailRate,
    averageDailyRate,
    hoursSinceActivity,
    isHighVolume: averageDailyRate > 50,
    isActive: hoursSinceActivity !== null && hoursSinceActivity < 2,
  };
}

/**
 * Determine sync schedule based on activity and mode
 */
function determineSyncSchedule(
  account: any,
  activity: any,
  mode: 'aggressive' | 'balanced' | 'conservative'
): SyncSchedule {
  const now = new Date();

  // Check error state
  if (account.consecutiveErrors >= 3) {
    // Back off if errors persist
    const backoffMinutes = Math.min(
      Math.pow(2, account.consecutiveErrors) * 5,
      240
    );
    return {
      immediate: false,
      nextSyncAt: new Date(now.getTime() + backoffMinutes * 60 * 1000),
      priority: 4,
      reason: `Backing off due to ${account.consecutiveErrors} consecutive errors`,
    };
  }

  // Never synced before - immediate sync
  if (!account.lastSyncAt) {
    return {
      immediate: true,
      nextSyncAt: now,
      priority: 0,
      reason: 'Initial sync required',
    };
  }

  const hoursSinceLastSync =
    (now.getTime() - new Date(account.lastSyncAt).getTime()) / (1000 * 60 * 60);

  // Mode: Aggressive (real-time sync)
  if (mode === 'aggressive') {
    if (activity.isActive) {
      return {
        immediate: hoursSinceLastSync > 0.08, // 5 minutes
        nextSyncAt: new Date(now.getTime() + 5 * 60 * 1000),
        priority: 0,
        reason: 'Aggressive mode with active user',
      };
    }

    if (activity.isHighVolume) {
      return {
        immediate: hoursSinceLastSync > 0.25, // 15 minutes
        nextSyncAt: new Date(now.getTime() + 15 * 60 * 1000),
        priority: 1,
        reason: 'Aggressive mode with high volume',
      };
    }

    return {
      immediate: hoursSinceLastSync > 0.5, // 30 minutes
      nextSyncAt: new Date(now.getTime() + 30 * 60 * 1000),
      priority: 2,
      reason: 'Aggressive mode - regular sync',
    };
  }

  // Mode: Balanced (adaptive sync)
  if (mode === 'balanced') {
    if (activity.isActive && activity.isHighVolume) {
      return {
        immediate: hoursSinceLastSync > 0.25, // 15 minutes
        nextSyncAt: new Date(now.getTime() + 15 * 60 * 1000),
        priority: 1,
        reason: 'Active user with high email volume',
      };
    }

    if (activity.isActive) {
      return {
        immediate: hoursSinceLastSync > 0.5, // 30 minutes
        nextSyncAt: new Date(now.getTime() + 30 * 60 * 1000),
        priority: 2,
        reason: 'Active user',
      };
    }

    if (activity.isHighVolume) {
      return {
        immediate: hoursSinceLastSync > 1, // 1 hour
        nextSyncAt: new Date(now.getTime() + 60 * 60 * 1000),
        priority: 2,
        reason: 'High email volume',
      };
    }

    return {
      immediate: hoursSinceLastSync > 4, // 4 hours
      nextSyncAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      priority: 3,
      reason: 'Balanced mode - standard interval',
    };
  }

  // Mode: Conservative (manual/scheduled sync)
  if (mode === 'conservative') {
    if (activity.isActive && activity.isHighVolume) {
      return {
        immediate: hoursSinceLastSync > 2, // 2 hours
        nextSyncAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        priority: 3,
        reason: 'Conservative mode with activity',
      };
    }

    return {
      immediate: hoursSinceLastSync > 12, // 12 hours
      nextSyncAt: new Date(now.getTime() + 12 * 60 * 60 * 1000),
      priority: 4,
      reason: 'Conservative mode - minimal syncing',
    };
  }

  // Default fallback
  return {
    immediate: hoursSinceLastSync > 4,
    nextSyncAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
    priority: 2,
    reason: 'Default schedule',
  };
}

/**
 * Auto-schedule syncs for all accounts based on activity
 */
export async function autoScheduleSyncs(userId: string): Promise<{
  scheduled: number;
  immediate: number;
}> {
  // Get all active accounts for user
  const accounts = await db
    .select()
    .from(emailAccounts)
    .where(
      and(eq(emailAccounts.userId, userId), eq(emailAccounts.status, 'active'))
    );

  let scheduled = 0;
  let immediate = 0;

  for (const account of accounts) {
    try {
      // Calculate schedule
      const schedule = await calculateSyncSchedule({
        userId,
        accountId: account.id,
        mode: 'balanced',
      });

      // Queue sync job
      if (schedule.immediate) {
        await queueSyncJob(account.id, userId, {
          type: 'incremental',
          priority: schedule.priority,
          scheduledFor: new Date(),
        });
        immediate++;
      } else {
        await queueSyncJob(account.id, userId, {
          type: 'incremental',
          priority: schedule.priority,
          scheduledFor: schedule.nextSyncAt,
        });
        scheduled++;
      }

      // Update next scheduled sync time
      await db
        .update(emailAccounts)
        .set({
          nextScheduledSyncAt: schedule.nextSyncAt,
          syncPriority: schedule.priority,
          updatedAt: new Date(),
        } as any)
        .where(eq(emailAccounts.id, account.id));
    } catch (error) {
      console.error(
        `Failed to schedule sync for account ${account.id}:`,
        error
      );
    }
  }

  return { scheduled, immediate };
}

/**
 * Update sync frequency based on user behavior
 */
export async function adaptSyncFrequency(accountId: string): Promise<void> {
  const activity = await analyzeAccountActivity(accountId);

  let newPriority: number;
  if (activity.isActive && activity.isHighVolume) {
    newPriority = 1; // High priority
  } else if (activity.isActive || activity.isHighVolume) {
    newPriority = 2; // Normal priority
  } else {
    newPriority = 3; // Low priority
  }

  await db
    .update(emailAccounts)
    .set({
      syncPriority: newPriority,
      updatedAt: new Date(),
    } as any)
    .where(eq(emailAccounts.id, accountId));
}
