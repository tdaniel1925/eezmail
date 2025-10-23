// src/lib/sync/smart-scheduler.ts
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { syncAnalyticsService } from './analytics-service';

export interface SyncSchedule {
  accountId: string;
  nextSyncAt: Date;
  syncInterval: number; // minutes
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

/**
 * Smart Sync Scheduler
 * Learns from usage patterns to optimize sync timing
 */
export class SmartScheduler {
  private defaultInterval = 15; // 15 minutes default
  private minInterval = 5; // minimum 5 minutes
  private maxInterval = 60; // maximum 60 minutes

  /**
   * Calculate optimal sync schedule for an account
   * Based on email volume patterns and user activity
   */
  async calculateOptimalSchedule(accountId: string): Promise<SyncSchedule> {
    // Get analytics for this account
    const analytics = await syncAnalyticsService.getAccountAnalytics(accountId, 7);
    const currentHour = new Date().getHours();

    // Determine priority based on email volume patterns
    const currentHourVolume =
      analytics.patterns.emailVolumeByHour.find((v) => v.hour === currentHour)
        ?.volume || 0;

    const avgVolume =
      analytics.patterns.emailVolumeByHour.reduce(
        (sum, v) => sum + v.volume,
        0
      ) / analytics.patterns.emailVolumeByHour.length;

    let priority: 'high' | 'medium' | 'low';
    let syncInterval: number;
    let reason: string;

    // Peak hours (high email volume)
    if (currentHourVolume > avgVolume * 1.5) {
      priority = 'high';
      syncInterval = this.minInterval;
      reason = 'Peak email hours - high volume expected';
    }
    // Off-peak hours (low email volume)
    else if (currentHourVolume < avgVolume * 0.5) {
      priority = 'low';
      syncInterval = this.maxInterval;
      reason = 'Off-peak hours - low volume expected';
    }
    // Normal hours
    else {
      priority = 'medium';
      syncInterval = this.defaultInterval;
      reason = 'Normal activity period';
    }

    // Adjust based on recent failure rate
    if (analytics.efficiency.failureRate > 0.1) {
      // More than 10% failure rate
      syncInterval = Math.min(syncInterval * 1.5, this.maxInterval);
      reason += ' | Reduced frequency due to high failure rate';
    }

    // Adjust based on rate limiting
    if (analytics.efficiency.rateLimitRate > 0.05) {
      // More than 5% rate limited
      syncInterval = Math.min(syncInterval * 2, this.maxInterval);
      reason += ' | Reduced frequency to avoid rate limits';
    }

    // Calculate next sync time
    const nextSyncAt = new Date();
    nextSyncAt.setMinutes(nextSyncAt.getMinutes() + syncInterval);

    return {
      accountId,
      nextSyncAt,
      syncInterval,
      priority,
      reason,
    };
  }

  /**
   * Get all accounts that need syncing
   * Prioritized by smart scheduling
   */
  async getAccountsDueForSync(): Promise<
    Array<{
      accountId: string;
      userId: string;
      priority: 'high' | 'medium' | 'low';
      minutesSinceLastSync: number;
    }>
  > {
    const result = await db.execute(sql`
      SELECT 
        ea.id as account_id,
        ea.user_id,
        EXTRACT(EPOCH FROM (NOW() - MAX(sm.completed_at))) / 60 as minutes_since_last_sync
      FROM email_accounts ea
      LEFT JOIN sync_metrics sm ON ea.id = sm.account_id AND sm.status = 'completed'
      WHERE ea.status = 'active'
      GROUP BY ea.id, ea.user_id
      HAVING 
        MAX(sm.completed_at) IS NULL OR
        EXTRACT(EPOCH FROM (NOW() - MAX(sm.completed_at))) / 60 > 15
      ORDER BY minutes_since_last_sync DESC NULLS FIRST
      LIMIT 50
    `);

    const accounts = [];

    for (const row of result.rows) {
      const accountId = (row as any).account_id;
      const userId = (row as any).user_id;
      const minutesSinceLastSync = parseFloat((row as any).minutes_since_last_sync || '999');

      // Calculate schedule for each account
      const schedule = await this.calculateOptimalSchedule(accountId);

      accounts.push({
        accountId,
        userId,
        priority: schedule.priority,
        minutesSinceLastSync,
      });
    }

    // Sort by priority
    accounts.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return accounts;
  }

  /**
   * Determine if an account should sync now
   */
  async shouldSyncNow(accountId: string): Promise<boolean> {
    const schedule = await this.calculateOptimalSchedule(accountId);
    
    // Check if it's time for the next sync
    return schedule.nextSyncAt <= new Date();
  }

  /**
   * Get recommended sync intervals for all hours of the day
   * Based on historical patterns
   */
  async getRecommendedSchedule(
    accountId: string
  ): Promise<Array<{ hour: number; interval: number; priority: string }>> {
    const analytics = await syncAnalyticsService.getAccountAnalytics(accountId, 30);
    const schedule = [];

    for (let hour = 0; hour < 24; hour++) {
      const volumeData = analytics.patterns.emailVolumeByHour.find(
        (v) => v.hour === hour
      );
      const volume = volumeData?.volume || 0;

      const avgVolume =
        analytics.patterns.emailVolumeByHour.reduce(
          (sum, v) => sum + v.volume,
          0
        ) / analytics.patterns.emailVolumeByHour.length;

      let interval: number;
      let priority: string;

      if (volume > avgVolume * 1.5) {
        interval = this.minInterval;
        priority = 'high';
      } else if (volume < avgVolume * 0.5) {
        interval = this.maxInterval;
        priority = 'low';
      } else {
        interval = this.defaultInterval;
        priority = 'medium';
      }

      schedule.push({ hour, interval, priority });
    }

    return schedule;
  }

  /**
   * Predict next high-volume period
   */
  async predictNextPeakTime(accountId: string): Promise<{
    hour: number;
    expectedVolume: number;
    confidence: number;
  } | null> {
    const analytics = await syncAnalyticsService.getAccountAnalytics(accountId, 30);
    const currentHour = new Date().getHours();

    // Find peak hours
    const peaks = analytics.patterns.emailVolumeByHour
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 3);

    // Find next peak after current hour
    const nextPeak = peaks
      .filter((p) => p.hour > currentHour)
      .sort((a, b) => a.hour - b.hour)[0];

    if (!nextPeak) {
      // If no peak found after current hour, get the first peak tomorrow
      const firstPeak = peaks.sort((a, b) => a.hour - b.hour)[0];
      return firstPeak
        ? {
            hour: firstPeak.hour + 24,
            expectedVolume: firstPeak.volume,
            confidence: 0.7,
          }
        : null;
    }

    return {
      hour: nextPeak.hour,
      expectedVolume: nextPeak.volume,
      confidence: 0.8,
    };
  }

  /**
   * Analyze sync efficiency and suggest improvements
   */
  async analyzeSyncEfficiency(accountId: string): Promise<{
    currentEfficiency: number;
    suggestions: string[];
    potentialImprovements: Array<{
      change: string;
      expectedImprovement: string;
    }>;
  }> {
    const analytics = await syncAnalyticsService.getAccountAnalytics(accountId, 30);
    const suggestions: string[] = [];
    const improvements = [];

    // Calculate current efficiency score (0-100)
    const failureScore = Math.max(0, 100 - analytics.efficiency.failureRate * 1000);
    const duplicateScore = Math.max(
      0,
      100 - analytics.efficiency.duplicateRate * 200
    );
    const speedScore = Math.min(100, analytics.efficiency.processingSpeed * 2);
    const currentEfficiency = (failureScore + duplicateScore + speedScore) / 3;

    // Analyze and suggest
    if (analytics.efficiency.failureRate > 0.05) {
      suggestions.push(
        'High failure rate detected. Consider investigating error logs.'
      );
      improvements.push({
        change: 'Reduce sync frequency during high-failure periods',
        expectedImprovement: 'May reduce failure rate by 20-30%',
      });
    }

    if (analytics.efficiency.duplicateRate > 0.1) {
      suggestions.push(
        'High duplicate rate. Fuzzy duplicate detection is working well.'
      );
      improvements.push({
        change: 'Continue using duplicate detection',
        expectedImprovement: 'Prevents ~10% redundant processing',
      });
    }

    if (analytics.efficiency.rateLimitRate > 0.02) {
      suggestions.push(
        'Approaching rate limits. Consider spreading out sync operations.'
      );
      improvements.push({
        change: 'Increase sync interval during peak API usage',
        expectedImprovement: 'Reduces rate limit hits by 50%+',
      });
    }

    if (analytics.efficiency.processingSpeed < 10) {
      suggestions.push(
        'Low processing speed. Check for network or database bottlenecks.'
      );
      improvements.push({
        change: 'Enable connection pooling and batch processing',
        expectedImprovement: 'Could improve speed by 2-3x',
      });
    }

    // Suggest optimal sync times
    const peakHours = analytics.patterns.peakSyncHours;
    suggestions.push(
      `Peak email hours: ${peakHours.join(', ')}:00. Sync more frequently during these times.`
    );

    return {
      currentEfficiency: Math.round(currentEfficiency),
      suggestions,
      potentialImprovements: improvements,
    };
  }
}

// Export singleton instance
export const smartScheduler = new SmartScheduler();

