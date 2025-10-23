// src/lib/sync/metrics-logger.ts
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export type ErrorType =
  | 'network'
  | 'parsing'
  | 'validation'
  | 'duplicate'
  | 'rate_limit'
  | 'unknown';

export type SyncStatus = 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface SyncMetrics {
  id?: string;
  accountId: string;
  folderId?: string;
  syncType: 'initial' | 'manual' | 'auto' | 'retry';
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  status: SyncStatus;

  // Counts
  totalMessages: number;
  messagesProcessed: number;
  messagesInserted: number;
  messagesUpdated: number;
  messagesSkipped: number;
  messagesFailed: number;
  duplicatesFound: number;

  // Performance
  avgMessageProcessingMs?: number;
  apiCallsMade: number;
  rateLimitHits: number;

  // Errors
  errors: Array<{
    messageId: string;
    errorType: ErrorType;
    errorMessage: string;
    timestamp: Date;
  }>;
  errorSummary?: string;

  // Resources
  memoryUsedMb?: number;

  // Metadata
  provider: 'gmail' | 'outlook' | 'imap';
  checkpointData?: any;
  metadata?: Record<string, any>;
}

/**
 * Metrics logger for comprehensive sync monitoring
 */
export class MetricsLogger {
  private currentMetrics: Map<string, SyncMetrics> = new Map();

  /**
   * Start tracking metrics for a sync operation
   */
  async startSync(
    accountId: string,
    syncType: 'initial' | 'manual' | 'auto' | 'retry',
    provider: 'gmail' | 'outlook' | 'imap',
    totalMessages: number = 0,
    folderId?: string
  ): Promise<string> {
    const metricsId = `${accountId}-${folderId || 'account'}-${Date.now()}`;

    const metrics: SyncMetrics = {
      accountId,
      folderId,
      syncType,
      provider,
      startedAt: new Date(),
      status: 'in_progress',
      totalMessages,
      messagesProcessed: 0,
      messagesInserted: 0,
      messagesUpdated: 0,
      messagesSkipped: 0,
      messagesFailed: 0,
      duplicatesFound: 0,
      apiCallsMade: 0,
      rateLimitHits: 0,
      errors: [],
    };

    this.currentMetrics.set(metricsId, metrics);

    // Insert into database
    const result = await db.execute(sql`
      INSERT INTO sync_metrics (
        account_id, folder_id, sync_type, provider, started_at, status,
        total_messages, messages_processed, messages_inserted, messages_updated,
        messages_skipped, messages_failed, duplicates_found, api_calls_made,
        rate_limit_hits, errors
      )
      VALUES (
        ${accountId}, ${folderId || null}, ${syncType}, ${provider},
        ${metrics.startedAt}, ${metrics.status}, ${totalMessages}, 0, 0, 0, 0, 0, 0, 0, 0, '[]'::jsonb
      )
      RETURNING id
    `);

    const id = (result.rows[0] as any).id;
    metrics.id = id;
    this.currentMetrics.set(metricsId, metrics);

    console.log(`📊 Started metrics tracking: ${metricsId}`);
    return metricsId;
  }

  /**
   * Update metrics during sync
   */
  async updateMetrics(
    metricsId: string,
    updates: {
      messagesProcessed?: number;
      messagesInserted?: number;
      messagesUpdated?: number;
      messagesSkipped?: number;
      messagesFailed?: number;
      duplicatesFound?: number;
      apiCallsMade?: number;
      rateLimitHits?: number;
    }
  ): Promise<void> {
    const metrics = this.currentMetrics.get(metricsId);
    if (!metrics) return;

    // Update metrics
    Object.assign(metrics, updates);

    // Periodically persist to database (every 50 messages)
    if (
      updates.messagesProcessed !== undefined &&
      updates.messagesProcessed % 50 === 0
    ) {
      await this.persistMetrics(metrics);
    }
  }

  /**
   * Log an error during sync
   */
  async logError(
    metricsId: string,
    messageId: string,
    errorType: ErrorType,
    errorMessage: string,
    errorStack?: string
  ): Promise<void> {
    const metrics = this.currentMetrics.get(metricsId);
    if (!metrics) return;

    // Add to errors array
    metrics.errors.push({
      messageId,
      errorType,
      errorMessage,
      timestamp: new Date(),
    });

    metrics.messagesFailed++;

    // Also log to failed_sync_messages table
    await this.logFailedMessage(
      metrics.accountId,
      messageId,
      errorType,
      errorMessage,
      errorStack,
      metrics.folderId
    );
  }

  /**
   * Complete sync metrics
   */
  async completeSync(
    metricsId: string,
    status: 'completed' | 'failed' | 'cancelled'
  ): Promise<void> {
    const metrics = this.currentMetrics.get(metricsId);
    if (!metrics) return;

    metrics.status = status;
    metrics.completedAt = new Date();
    metrics.durationMs =
      metrics.completedAt.getTime() - metrics.startedAt.getTime();

    // Calculate average processing time
    if (metrics.messagesProcessed > 0) {
      metrics.avgMessageProcessingMs =
        metrics.durationMs / metrics.messagesProcessed;
    }

    // Generate error summary
    if (metrics.errors.length > 0) {
      const errorCounts = metrics.errors.reduce(
        (acc, err) => {
          acc[err.errorType] = (acc[err.errorType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      metrics.errorSummary = Object.entries(errorCounts)
        .map(([type, count]) => `${type}: ${count}`)
        .join(', ');
    }

    // Get memory usage
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      metrics.memoryUsedMb = Math.round(memUsage.heapUsed / 1024 / 1024);
    }

    // Persist final metrics
    await this.persistMetrics(metrics);

    // Remove from memory
    this.currentMetrics.delete(metricsId);

    console.log(
      `📊 Sync metrics completed: ${metricsId} - ${status} (${metrics.messagesProcessed}/${metrics.totalMessages} messages, ${metrics.durationMs}ms)`
    );
  }

  /**
   * Persist metrics to database
   */
  private async persistMetrics(metrics: SyncMetrics): Promise<void> {
    try {
      await db.execute(sql`
        UPDATE sync_metrics
        SET 
          completed_at = ${metrics.completedAt || null},
          duration_ms = ${metrics.durationMs || null},
          status = ${metrics.status},
          total_messages = ${metrics.totalMessages},
          messages_processed = ${metrics.messagesProcessed},
          messages_inserted = ${metrics.messagesInserted},
          messages_updated = ${metrics.messagesUpdated},
          messages_skipped = ${metrics.messagesSkipped},
          messages_failed = ${metrics.messagesFailed},
          duplicates_found = ${metrics.duplicatesFound},
          avg_message_processing_ms = ${metrics.avgMessageProcessingMs || null},
          api_calls_made = ${metrics.apiCallsMade},
          rate_limit_hits = ${metrics.rateLimitHits},
          errors = ${JSON.stringify(metrics.errors)}::jsonb,
          error_summary = ${metrics.errorSummary || null},
          memory_used_mb = ${metrics.memoryUsedMb || null},
          updated_at = NOW()
        WHERE id = ${metrics.id}
      `);
    } catch (error) {
      console.error('Error persisting metrics:', error);
    }
  }

  /**
   * Log a failed message to the failed_sync_messages table
   */
  private async logFailedMessage(
    accountId: string,
    messageId: string,
    errorType: ErrorType,
    errorMessage: string,
    errorStack?: string,
    folderId?: string
  ): Promise<void> {
    try {
      // Calculate next retry time (exponential backoff)
      const nextRetryAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      await db.execute(sql`
        INSERT INTO failed_sync_messages (
          account_id, folder_id, message_id, error_type, error_message,
          error_stack, next_retry_at, status
        )
        VALUES (
          ${accountId}, ${folderId || null}, ${messageId}, ${errorType},
          ${errorMessage}, ${errorStack || null}, ${nextRetryAt}, 'pending'
        )
        ON CONFLICT DO NOTHING
      `);
    } catch (error) {
      console.error('Error logging failed message:', error);
    }
  }

  /**
   * Get sync health summary for an account
   */
  async getSyncHealth(accountId: string): Promise<any> {
    const result = await db.execute(sql`
      SELECT * FROM sync_health_summary
      WHERE account_id = ${accountId}
    `);

    return result.rows[0] || null;
  }

  /**
   * Get recent failed messages for retry
   */
  async getFailedMessagesForRetry(accountId: string, limit: number = 10): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT * FROM failed_sync_messages
      WHERE account_id = ${accountId}
        AND status = 'pending'
        AND next_retry_at <= NOW()
        AND retry_count < 3
      ORDER BY created_at ASC
      LIMIT ${limit}
    `);

    return result.rows;
  }
}

// Export singleton instance
export const metricsLogger = new MetricsLogger();

