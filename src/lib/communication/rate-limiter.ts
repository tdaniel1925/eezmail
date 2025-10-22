'use server';

/**
 * Rate Limiting Service for Communication Features
 * Prevents abuse of SMS and voice call features
 */

import { db } from '@/lib/db';
import { communicationLimits, communicationUsage } from '@/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

export interface RateLimitCheck {
  allowed: boolean;
  reason?: string;
  remaining?: {
    minute: number;
    hour: number;
    day: number;
  };
  limit?: {
    minute: number;
    hour: number;
    day: number;
  };
}

/**
 * Check if user can send communication based on their limits
 */
export async function checkRateLimit(
  userId: string,
  type: 'sms' | 'voice_call'
): Promise<RateLimitCheck> {
  try {
    // Get user's rate limits
    const limits = await db.query.communicationLimits.findFirst({
      where: and(
        eq(communicationLimits.userId, userId),
        eq(communicationLimits.isActive, true)
      ),
    });

    if (!limits) {
      // No limits set, use default personal plan
      return {
        allowed: true,
        remaining: { minute: 1, hour: 10, day: 100 },
        limit: { minute: 1, hour: 10, day: 100 },
      };
    }

    // Calculate time thresholds
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Count usage in different time windows
    const [minuteCount, hourCount, dayCount] = await Promise.all([
      // Last minute
      db
        .select({ count: sql<number>`count(*)` })
        .from(communicationUsage)
        .where(
          and(
            eq(communicationUsage.userId, userId),
            eq(communicationUsage.type, type),
            gte(communicationUsage.sentAt, oneMinuteAgo),
            eq(communicationUsage.status, 'sent')
          )
        )
        .then((result) => Number(result[0]?.count || 0)),

      // Last hour
      db
        .select({ count: sql<number>`count(*)` })
        .from(communicationUsage)
        .where(
          and(
            eq(communicationUsage.userId, userId),
            eq(communicationUsage.type, type),
            gte(communicationUsage.sentAt, oneHourAgo),
            eq(communicationUsage.status, 'sent')
          )
        )
        .then((result) => Number(result[0]?.count || 0)),

      // Last day
      db
        .select({ count: sql<number>`count(*)` })
        .from(communicationUsage)
        .where(
          and(
            eq(communicationUsage.userId, userId),
            eq(communicationUsage.type, type),
            gte(communicationUsage.sentAt, oneDayAgo),
            eq(communicationUsage.status, 'sent')
          )
        )
        .then((result) => Number(result[0]?.count || 0)),
    ]);

    // Get limits based on type
    const perMinuteLimit = type === 'sms' ? limits.smsPerMinute : limits.voicePerMinute;
    const perHourLimit = type === 'sms' ? limits.smsPerHour : limits.voicePerHour;
    const perDayLimit = type === 'sms' ? limits.smsPerDay : limits.voicePerDay;

    // Check each time window
    if (minuteCount >= perMinuteLimit) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${perMinuteLimit} ${type === 'sms' ? 'SMS' : 'calls'} per minute`,
        remaining: {
          minute: 0,
          hour: Math.max(0, perHourLimit - hourCount),
          day: Math.max(0, perDayLimit - dayCount),
        },
        limit: {
          minute: perMinuteLimit,
          hour: perHourLimit,
          day: perDayLimit,
        },
      };
    }

    if (hourCount >= perHourLimit) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${perHourLimit} ${type === 'sms' ? 'SMS' : 'calls'} per hour`,
        remaining: {
          minute: Math.max(0, perMinuteLimit - minuteCount),
          hour: 0,
          day: Math.max(0, perDayLimit - dayCount),
        },
        limit: {
          minute: perMinuteLimit,
          hour: perHourLimit,
          day: perDayLimit,
        },
      };
    }

    if (dayCount >= perDayLimit) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${perDayLimit} ${type === 'sms' ? 'SMS' : 'calls'} per day`,
        remaining: {
          minute: Math.max(0, perMinuteLimit - minuteCount),
          hour: Math.max(0, perHourLimit - hourCount),
          day: 0,
        },
        limit: {
          minute: perMinuteLimit,
          hour: perHourLimit,
          day: perDayLimit,
        },
      };
    }

    // All checks passed
    return {
      allowed: true,
      remaining: {
        minute: perMinuteLimit - minuteCount,
        hour: perHourLimit - hourCount,
        day: perDayLimit - dayCount,
      },
      limit: {
        minute: perMinuteLimit,
        hour: perHourLimit,
        day: perDayLimit,
      },
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail closed - deny access on error
    return {
      allowed: false,
      reason: 'Rate limit check failed',
    };
  }
}

/**
 * Log communication usage for rate limiting
 */
export async function logCommunicationUsage(
  userId: string,
  type: 'sms' | 'voice_call',
  recipientPhone: string,
  status: 'sent' | 'failed' | 'rate_limited',
  options?: {
    contactId?: string;
    cost?: string;
    usedCustomTwilio?: boolean;
    messagePreview?: string;
    errorMessage?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.insert(communicationUsage).values({
      userId,
      type,
      recipientPhone,
      status,
      contactId: options?.contactId || null,
      cost: options?.cost || null,
      usedCustomTwilio: options?.usedCustomTwilio || false,
      messagePreview: options?.messagePreview || null,
      errorMessage: options?.errorMessage || null,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to log communication usage:', error);
    return {
      success: false,
      error: 'Failed to log usage',
    };
  }
}

/**
 * Get communication usage statistics for a user
 */
export async function getCommunicationStats(userId: string, days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await db.query.communicationUsage.findMany({
      where: and(
        eq(communicationUsage.userId, userId),
        gte(communicationUsage.sentAt, startDate)
      ),
      orderBy: (usage, { desc }) => [desc(usage.sentAt)],
    });

    const summary = {
      total: stats.length,
      sms: stats.filter((s) => s.type === 'sms').length,
      voice: stats.filter((s) => s.type === 'voice_call').length,
      sent: stats.filter((s) => s.status === 'sent').length,
      failed: stats.filter((s) => s.status === 'failed').length,
      rateLimited: stats.filter((s) => s.status === 'rate_limited').length,
      totalCost: stats
        .filter((s) => s.cost)
        .reduce((sum, s) => sum + parseFloat(s.cost || '0'), 0),
      usedSystemTwilio: stats.filter((s) => !s.usedCustomTwilio).length,
      usedCustomTwilio: stats.filter((s) => s.usedCustomTwilio).length,
    };

    return {
      success: true,
      stats,
      summary,
    };
  } catch (error) {
    console.error('Failed to get communication stats:', error);
    return {
      success: false,
      error: 'Failed to retrieve stats',
      stats: [],
      summary: null,
    };
  }
}

