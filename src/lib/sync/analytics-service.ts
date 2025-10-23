// src/lib/sync/analytics-service.ts
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export interface SyncAnalytics {
  performance: {
    avgSyncTime: number;
    fastestSync: number;
    slowestSync: number;
    syncsByTimeOfDay: Array<{ hour: number; count: number; avgDuration: number }>;
    syncsByDayOfWeek: Array<{ day: number; count: number; avgDuration: number }>;
  };
  patterns: {
    peakSyncHours: number[];
    emailVolumeByHour: Array<{ hour: number; volume: number }>;
    syncFrequency: {
      hourly: number;
      daily: number;
      weekly: number;
    };
  };
  efficiency: {
    duplicateRate: number;
    failureRate: number;
    rateLimitRate: number;
    avgMessagesPerSync: number;
    processingSpeed: number; // messages per second
  };
  trends: {
    syncCountTrend: Array<{ date: string; count: number }>;
    performanceTrend: Array<{ date: string; avgDuration: number }>;
    errorTrend: Array<{ date: string; errorCount: number }>;
  };
}

/**
 * Analytics service for sync performance monitoring
 */
export class SyncAnalyticsService {
  /**
   * Get comprehensive analytics for an account
   */
  async getAccountAnalytics(
    accountId: string,
    days: number = 30
  ): Promise<SyncAnalytics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Performance metrics
    const performanceResult = await db.execute(sql`
      SELECT 
        AVG(duration_ms) as avg_sync_time,
        MIN(duration_ms) as fastest_sync,
        MAX(duration_ms) as slowest_sync
      FROM sync_metrics
      WHERE account_id = ${accountId}
        AND started_at > ${startDate}
        AND status = 'completed'
        AND duration_ms IS NOT NULL
    `);

    const performance = performanceResult.rows[0] as any;

    // Syncs by time of day
    const timeOfDayResult = await db.execute(sql`
      SELECT 
        EXTRACT(HOUR FROM started_at) as hour,
        COUNT(*) as count,
        AVG(duration_ms) as avg_duration
      FROM sync_metrics
      WHERE account_id = ${accountId}
        AND started_at > ${startDate}
      GROUP BY EXTRACT(HOUR FROM started_at)
      ORDER BY hour
    `);

    const syncsByTimeOfDay = timeOfDayResult.rows.map((row: any) => ({
      hour: parseInt(row.hour),
      count: parseInt(row.count),
      avgDuration: parseFloat(row.avg_duration || '0'),
    }));

    // Syncs by day of week
    const dayOfWeekResult = await db.execute(sql`
      SELECT 
        EXTRACT(DOW FROM started_at) as day,
        COUNT(*) as count,
        AVG(duration_ms) as avg_duration
      FROM sync_metrics
      WHERE account_id = ${accountId}
        AND started_at > ${startDate}
      GROUP BY EXTRACT(DOW FROM started_at)
      ORDER BY day
    `);

    const syncsByDayOfWeek = dayOfWeekResult.rows.map((row: any) => ({
      day: parseInt(row.day),
      count: parseInt(row.count),
      avgDuration: parseFloat(row.avg_duration || '0'),
    }));

    // Find peak sync hours (top 3)
    const peakHours = syncsByTimeOfDay
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(h => h.hour);

    // Email volume by hour
    const volumeResult = await db.execute(sql`
      SELECT 
        EXTRACT(HOUR FROM received_at) as hour,
        COUNT(*) as volume
      FROM emails
      WHERE account_id = ${accountId}
        AND received_at > ${startDate}
      GROUP BY EXTRACT(HOUR FROM received_at)
      ORDER BY hour
    `);

    const emailVolumeByHour = volumeResult.rows.map((row: any) => ({
      hour: parseInt(row.hour),
      volume: parseInt(row.volume),
    }));

    // Sync frequency
    const frequencyResult = await db.execute(sql`
      SELECT 
        COUNT(*) FILTER (WHERE started_at > NOW() - INTERVAL '1 hour') as hourly,
        COUNT(*) FILTER (WHERE started_at > NOW() - INTERVAL '1 day') as daily,
        COUNT(*) FILTER (WHERE started_at > NOW() - INTERVAL '7 days') as weekly
      FROM sync_metrics
      WHERE account_id = ${accountId}
    `);

    const frequency = frequencyResult.rows[0] as any;

    // Efficiency metrics
    const efficiencyResult = await db.execute(sql`
      SELECT 
        SUM(duplicates_found)::float / NULLIF(SUM(total_messages), 0) as duplicate_rate,
        SUM(messages_failed)::float / NULLIF(SUM(messages_processed), 0) as failure_rate,
        SUM(rate_limit_hits)::float / NULLIF(SUM(api_calls_made), 0) as rate_limit_rate,
        AVG(messages_processed) as avg_messages_per_sync,
        SUM(messages_processed)::float / NULLIF(SUM(duration_ms / 1000.0), 0) as processing_speed
      FROM sync_metrics
      WHERE account_id = ${accountId}
        AND started_at > ${startDate}
        AND status = 'completed'
    `);

    const efficiency = efficiencyResult.rows[0] as any;

    // Trends - daily aggregates
    const trendResult = await db.execute(sql`
      SELECT 
        DATE(started_at) as date,
        COUNT(*) as count,
        AVG(duration_ms) as avg_duration,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as error_count
      FROM sync_metrics
      WHERE account_id = ${accountId}
        AND started_at > ${startDate}
      GROUP BY DATE(started_at)
      ORDER BY date
    `);

    const syncCountTrend = trendResult.rows.map((row: any) => ({
      date: row.date,
      count: parseInt(row.count),
    }));

    const performanceTrend = trendResult.rows.map((row: any) => ({
      date: row.date,
      avgDuration: parseFloat(row.avg_duration || '0'),
    }));

    const errorTrend = trendResult.rows.map((row: any) => ({
      date: row.date,
      errorCount: parseInt(row.error_count || '0'),
    }));

    return {
      performance: {
        avgSyncTime: parseFloat(performance.avg_sync_time || '0'),
        fastestSync: parseFloat(performance.fastest_sync || '0'),
        slowestSync: parseFloat(performance.slowest_sync || '0'),
        syncsByTimeOfDay,
        syncsByDayOfWeek,
      },
      patterns: {
        peakSyncHours: peakHours,
        emailVolumeByHour,
        syncFrequency: {
          hourly: parseInt(frequency.hourly || '0'),
          daily: parseInt(frequency.daily || '0'),
          weekly: parseInt(frequency.weekly || '0'),
        },
      },
      efficiency: {
        duplicateRate: parseFloat(efficiency.duplicate_rate || '0'),
        failureRate: parseFloat(efficiency.failure_rate || '0'),
        rateLimitRate: parseFloat(efficiency.rate_limit_rate || '0'),
        avgMessagesPerSync: parseFloat(efficiency.avg_messages_per_sync || '0'),
        processingSpeed: parseFloat(efficiency.processing_speed || '0'),
      },
      trends: {
        syncCountTrend,
        performanceTrend,
        errorTrend,
      },
    };
  }

  /**
   * Get real-time sync statistics
   */
  async getRealtimeStats(accountId: string): Promise<{
    currentSyncStatus: 'idle' | 'syncing' | 'error';
    lastSyncTime: Date | null;
    nextSyncTime: Date | null;
    messagesInQueue: number;
    activeSyncs: number;
  }> {
    const statusResult = await db.execute(sql`
      SELECT 
        COALESCE(
          (SELECT status FROM sync_metrics 
           WHERE account_id = ${accountId} 
           ORDER BY started_at DESC LIMIT 1),
          'idle'
        ) as current_status,
        (SELECT MAX(completed_at) FROM sync_metrics 
         WHERE account_id = ${accountId} AND status = 'completed') as last_sync,
        COUNT(*) FILTER (WHERE status = 'in_progress') as active_syncs
      FROM sync_metrics
      WHERE account_id = ${accountId}
        AND started_at > NOW() - INTERVAL '1 hour'
    `);

    const status = statusResult.rows[0] as any;

    // Get messages in retry queue
    const queueResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM failed_sync_messages
      WHERE account_id = ${accountId}
        AND status = 'pending'
    `);

    const messagesInQueue = parseInt((queueResult.rows[0] as any)?.count || '0');

    // Calculate next sync time (every 15 minutes for auto-sync)
    let nextSyncTime: Date | null = null;
    if (status.last_sync) {
      nextSyncTime = new Date(status.last_sync);
      nextSyncTime.setMinutes(nextSyncTime.getMinutes() + 15);
    }

    return {
      currentSyncStatus: status.current_status || 'idle',
      lastSyncTime: status.last_sync ? new Date(status.last_sync) : null,
      nextSyncTime,
      messagesInQueue,
      activeSyncs: parseInt(status.active_syncs || '0'),
    };
  }

  /**
   * Generate sync performance report
   */
  async generatePerformanceReport(accountId: string, days: number = 30): Promise<string> {
    const analytics = await this.getAccountAnalytics(accountId, days);

    const report = `
# Sync Performance Report

## Performance Summary
- Average Sync Time: ${(analytics.performance.avgSyncTime / 1000).toFixed(2)}s
- Fastest Sync: ${(analytics.performance.fastestSync / 1000).toFixed(2)}s
- Slowest Sync: ${(analytics.performance.slowestSync / 1000).toFixed(2)}s

## Efficiency Metrics
- Duplicate Rate: ${(analytics.efficiency.duplicateRate * 100).toFixed(2)}%
- Failure Rate: ${(analytics.efficiency.failureRate * 100).toFixed(2)}%
- Processing Speed: ${analytics.efficiency.processingSpeed.toFixed(1)} messages/second
- Avg Messages/Sync: ${analytics.efficiency.avgMessagesPerSync.toFixed(0)}

## Sync Patterns
- Peak Sync Hours: ${analytics.patterns.peakSyncHours.join(', ')}
- Syncs Per Hour: ${analytics.patterns.syncFrequency.hourly}
- Syncs Per Day: ${analytics.patterns.syncFrequency.daily}
- Syncs Per Week: ${analytics.patterns.syncFrequency.weekly}

## Trends
- Total Syncs: ${analytics.trends.syncCountTrend.reduce((sum, t) => sum + t.count, 0)}
- Total Errors: ${analytics.trends.errorTrend.reduce((sum, t) => sum + t.errorCount, 0)}
    `.trim();

    return report;
  }
}

// Export singleton instance
export const syncAnalyticsService = new SyncAnalyticsService();

