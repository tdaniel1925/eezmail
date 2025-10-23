// src/lib/sync/checkpoint-manager.ts
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * Sync checkpoint data structure
 */
export interface SyncCheckpoint {
  accountId: string;
  folderId?: string;
  syncType: 'initial' | 'manual' | 'auto';
  startedAt: Date;
  lastCheckpointAt: Date;
  messagesProcessed: number;
  totalMessages: number;
  currentCursor?: string;
  currentPageToken?: string;
  currentBatch: number;
  status: 'in_progress' | 'completed' | 'failed' | 'paused';
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Manager for sync checkpoints and state persistence
 * Allows resuming interrupted syncs from the last successful checkpoint
 */
export class CheckpointManager {
  private checkpoints: Map<string, SyncCheckpoint> = new Map();

  /**
   * Get checkpoint key for an account/folder
   */
  private getCheckpointKey(accountId: string, folderId?: string): string {
    return folderId ? `${accountId}:${folderId}` : accountId;
  }

  /**
   * Create a new checkpoint for a sync operation
   */
  async createCheckpoint(
    accountId: string,
    syncType: 'initial' | 'manual' | 'auto',
    totalMessages: number = 0,
    folderId?: string
  ): Promise<SyncCheckpoint> {
    const checkpoint: SyncCheckpoint = {
      accountId,
      folderId,
      syncType,
      startedAt: new Date(),
      lastCheckpointAt: new Date(),
      messagesProcessed: 0,
      totalMessages,
      currentBatch: 0,
      status: 'in_progress',
    };

    const key = this.getCheckpointKey(accountId, folderId);
    this.checkpoints.set(key, checkpoint);

    // Persist to storage (using a JSON column in email_accounts)
    await this.persistCheckpoint(checkpoint);

    console.log(
      `📍 Checkpoint created for ${folderId || 'account'} ${accountId}`
    );
    return checkpoint;
  }

  /**
   * Update checkpoint progress
   */
  async updateCheckpoint(
    accountId: string,
    updates: {
      messagesProcessed?: number;
      currentCursor?: string;
      currentPageToken?: string;
      currentBatch?: number;
      metadata?: Record<string, any>;
    },
    folderId?: string
  ): Promise<void> {
    const key = this.getCheckpointKey(accountId, folderId);
    const checkpoint = this.checkpoints.get(key);

    if (!checkpoint) {
      console.warn(`No checkpoint found for ${key}`);
      return;
    }

    // Update checkpoint
    Object.assign(checkpoint, {
      ...updates,
      lastCheckpointAt: new Date(),
    });

    this.checkpoints.set(key, checkpoint);

    // Persist every 10 messages or when cursor changes
    if (
      updates.messagesProcessed !== undefined &&
      updates.messagesProcessed % 10 === 0
    ) {
      await this.persistCheckpoint(checkpoint);
    } else if (updates.currentCursor || updates.currentPageToken) {
      await this.persistCheckpoint(checkpoint);
    }
  }

  /**
   * Mark checkpoint as completed
   */
  async completeCheckpoint(
    accountId: string,
    folderId?: string
  ): Promise<void> {
    const key = this.getCheckpointKey(accountId, folderId);
    const checkpoint = this.checkpoints.get(key);

    if (!checkpoint) {
      console.warn(`No checkpoint found for ${key}`);
      return;
    }

    checkpoint.status = 'completed';
    checkpoint.lastCheckpointAt = new Date();

    await this.persistCheckpoint(checkpoint);

    // Remove from memory after a short delay
    setTimeout(() => {
      this.checkpoints.delete(key);
    }, 5000);

    console.log(
      `✅ Checkpoint completed for ${folderId || 'account'} ${accountId}`
    );
  }

  /**
   * Mark checkpoint as failed
   */
  async failCheckpoint(
    accountId: string,
    errorMessage: string,
    folderId?: string
  ): Promise<void> {
    const key = this.getCheckpointKey(accountId, folderId);
    const checkpoint = this.checkpoints.get(key);

    if (!checkpoint) {
      console.warn(`No checkpoint found for ${key}`);
      return;
    }

    checkpoint.status = 'failed';
    checkpoint.errorMessage = errorMessage;
    checkpoint.lastCheckpointAt = new Date();

    await this.persistCheckpoint(checkpoint);

    console.error(
      `❌ Checkpoint failed for ${folderId || 'account'} ${accountId}: ${errorMessage}`
    );
  }

  /**
   * Get an existing checkpoint
   */
  async getCheckpoint(
    accountId: string,
    folderId?: string
  ): Promise<SyncCheckpoint | null> {
    const key = this.getCheckpointKey(accountId, folderId);
    
    // Check memory first
    if (this.checkpoints.has(key)) {
      return this.checkpoints.get(key)!;
    }

    // Try to load from database
    return await this.loadCheckpoint(accountId, folderId);
  }

  /**
   * Check if sync can be resumed from a checkpoint
   */
  async canResumeSync(accountId: string, folderId?: string): Promise<boolean> {
    const checkpoint = await this.getCheckpoint(accountId, folderId);
    
    if (!checkpoint) return false;

    // Can resume if sync was in progress or paused
    if (checkpoint.status !== 'in_progress' && checkpoint.status !== 'paused') {
      return false;
    }

    // Check if checkpoint is not too old (max 24 hours)
    const age = Date.now() - checkpoint.lastCheckpointAt.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    return age < maxAge;
  }

  /**
   * Pause a sync checkpoint
   */
  async pauseCheckpoint(accountId: string, folderId?: string): Promise<void> {
    const key = this.getCheckpointKey(accountId, folderId);
    const checkpoint = this.checkpoints.get(key);

    if (!checkpoint) {
      console.warn(`No checkpoint found for ${key}`);
      return;
    }

    checkpoint.status = 'paused';
    checkpoint.lastCheckpointAt = new Date();

    await this.persistCheckpoint(checkpoint);

    console.log(
      `⏸️  Checkpoint paused for ${folderId || 'account'} ${accountId}`
    );
  }

  /**
   * Resume a paused checkpoint
   */
  async resumeCheckpoint(accountId: string, folderId?: string): Promise<SyncCheckpoint | null> {
    const checkpoint = await this.getCheckpoint(accountId, folderId);

    if (!checkpoint || checkpoint.status !== 'paused') {
      return null;
    }

    checkpoint.status = 'in_progress';
    checkpoint.lastCheckpointAt = new Date();

    const key = this.getCheckpointKey(accountId, folderId);
    this.checkpoints.set(key, checkpoint);

    await this.persistCheckpoint(checkpoint);

    console.log(
      `▶️  Checkpoint resumed for ${folderId || 'account'} ${accountId}`
    );

    return checkpoint;
  }

  /**
   * Persist checkpoint to database
   */
  private async persistCheckpoint(checkpoint: SyncCheckpoint): Promise<void> {
    try {
      // Store in a sync_checkpoints table (you'll need to create this)
      // For now, we'll store in email_accounts metadata
      await db.execute(sql`
        UPDATE email_accounts
        SET sync_checkpoint = ${JSON.stringify(checkpoint)}::jsonb,
            updated_at = NOW()
        WHERE id = ${checkpoint.accountId}
      `);
    } catch (error) {
      console.error('Error persisting checkpoint:', error);
    }
  }

  /**
   * Load checkpoint from database
   */
  private async loadCheckpoint(
    accountId: string,
    folderId?: string
  ): Promise<SyncCheckpoint | null> {
    try {
      const result = await db.execute(sql`
        SELECT sync_checkpoint
        FROM email_accounts
        WHERE id = ${accountId}
      `);

      if (result.rows.length === 0) return null;

      const checkpointData = (result.rows[0] as any).sync_checkpoint;
      if (!checkpointData) return null;

      const checkpoint = checkpointData as SyncCheckpoint;

      // Convert date strings back to Date objects
      checkpoint.startedAt = new Date(checkpoint.startedAt);
      checkpoint.lastCheckpointAt = new Date(checkpoint.lastCheckpointAt);

      // Only return if matches the folder (if specified)
      if (folderId && checkpoint.folderId !== folderId) {
        return null;
      }

      return checkpoint;
    } catch (error) {
      console.error('Error loading checkpoint:', error);
      return null;
    }
  }

  /**
   * Clear all checkpoints for an account
   */
  async clearCheckpoints(accountId: string): Promise<void> {
    // Remove from memory
    const keysToDelete: string[] = [];
    for (const [key, checkpoint] of this.checkpoints.entries()) {
      if (checkpoint.accountId === accountId) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.checkpoints.delete(key));

    // Clear from database
    await db.execute(sql`
      UPDATE email_accounts
      SET sync_checkpoint = NULL,
          updated_at = NOW()
      WHERE id = ${accountId}
    `);

    console.log(`🗑️  Cleared all checkpoints for account ${accountId}`);
  }

  /**
   * Get sync progress percentage
   */
  getProgress(accountId: string, folderId?: string): number {
    const key = this.getCheckpointKey(accountId, folderId);
    const checkpoint = this.checkpoints.get(key);

    if (!checkpoint || checkpoint.totalMessages === 0) return 0;

    return Math.round(
      (checkpoint.messagesProcessed / checkpoint.totalMessages) * 100
    );
  }
}

// Export singleton instance
export const checkpointManager = new CheckpointManager();

