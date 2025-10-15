/**
 * Background Job Queue System
 * Manages sync job scheduling, prioritization, and execution
 */

'use server';

import { db } from '@/lib/db';
import { syncJobs, emailAccounts } from '@/db/schema';
import { eq, and, or, lte, isNull, asc } from 'drizzle-orm';
import { syncEmailsFromNylas } from '@/lib/nylas/email-sync';
import { handleSyncError } from './error-handler';

export type JobPriority = 0 | 1 | 2 | 3 | 4; // immediate | high | normal | low | background

export interface QueueJobOptions {
  type?: 'full' | 'incremental' | 'selective' | 'webhook_triggered';
  priority?: JobPriority;
  scheduledFor?: Date;
  metadata?: {
    folders?: string[];
    since?: string;
    limit?: number;
  };
}

/**
 * Add sync job to queue
 */
export async function queueSyncJob(
  accountId: string,
  userId: string,
  options: QueueJobOptions = {}
): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    // Check for existing pending/in_progress jobs for this account
    const [existingJob] = await db
      .select()
      .from(syncJobs)
      .where(
        and(
          eq(syncJobs.accountId, accountId),
          or(eq(syncJobs.status, 'pending'), eq(syncJobs.status, 'in_progress'))
        )
      )
      .limit(1);

    if (existingJob) {
      return {
        success: false,
        error: 'Sync job already queued or in progress',
      };
    }

    // Create new job
    const [newJob] = await db
      .insert(syncJobs)
      .values({
        accountId,
        userId,
        jobType: options.type || 'incremental',
        priority: options.priority ?? 2,
        scheduledFor: options.scheduledFor || new Date(),
        metadata: options.metadata || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return { success: true, jobId: newJob.id };
  } catch (error) {
    console.error('Queue sync job error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get next job to process (highest priority, earliest scheduled)
 */
export async function getNextJob() {
  const now = new Date();

  const [job] = await db
    .select()
    .from(syncJobs)
    .where(
      and(
        eq(syncJobs.status, 'pending'),
        or(isNull(syncJobs.scheduledFor), lte(syncJobs.scheduledFor, now))
      )
    )
    .orderBy(asc(syncJobs.priority), asc(syncJobs.scheduledFor))
    .limit(1);

  return job || null;
}

/**
 * Mark job as started
 */
export async function startJob(jobId: string): Promise<void> {
  await db
    .update(syncJobs)
    .set({
      status: 'in_progress',
      startedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(syncJobs.id, jobId));
}

/**
 * Mark job as completed
 */
export async function completeJob(jobId: string): Promise<void> {
  await db
    .update(syncJobs)
    .set({
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(syncJobs.id, jobId));
}

/**
 * Mark job as failed and handle retry
 */
export async function failJob(jobId: string, error: string): Promise<void> {
  const [job] = await db
    .select()
    .from(syncJobs)
    .where(eq(syncJobs.id, jobId))
    .limit(1);

  if (!job) return;

  const shouldRetry = job.retryCount < job.maxRetries;

  if (shouldRetry) {
    // Increment retry count and reschedule
    const retryDelay = Math.pow(2, job.retryCount) * 60; // Exponential backoff in seconds
    const nextAttempt = new Date(Date.now() + retryDelay * 1000);

    await db
      .update(syncJobs)
      .set({
        status: 'pending',
        retryCount: job.retryCount + 1,
        errorMessage: error,
        scheduledFor: nextAttempt,
        updatedAt: new Date(),
      })
      .where(eq(syncJobs.id, jobId));
  } else {
    // Max retries reached, mark as failed
    await db
      .update(syncJobs)
      .set({
        status: 'failed',
        errorMessage: error,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(syncJobs.id, jobId));
  }
}

/**
 * Process a single job
 */
export async function processJob(jobId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const [job] = await db
      .select()
      .from(syncJobs)
      .where(eq(syncJobs.id, jobId))
      .limit(1);

    if (!job) {
      return { success: false, error: 'Job not found' };
    }

    // Mark as started
    await startJob(jobId);

    // Execute sync
    const result = await syncEmailsFromNylas(job.accountId, {
      mode: job.jobType === 'full' ? 'full' : 'incremental',
      folders: job.metadata?.folders,
      limit: job.metadata?.limit,
    });

    if (result.success) {
      await completeJob(jobId);
      return { success: true };
    } else {
      await failJob(jobId, result.error || 'Sync failed');
      return { success: false, error: result.error };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    await failJob(jobId, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Process all pending jobs (called by cron/scheduler)
 */
export async function processQueue(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  // Process jobs one at a time (can be parallelized with worker pool)
  while (true) {
    const job = await getNextJob();
    if (!job) break;

    const result = await processJob(job.id);
    processed++;

    if (result.success) {
      succeeded++;
    } else {
      failed++;
    }

    // Rate limiting: small delay between jobs
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return { processed, succeeded, failed };
}

/**
 * Cancel all pending jobs for an account
 */
export async function cancelAccountJobs(accountId: string): Promise<number> {
  const result = await db
    .update(syncJobs)
    .set({
      status: 'failed',
      errorMessage: 'Cancelled by user',
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(eq(syncJobs.accountId, accountId), eq(syncJobs.status, 'pending'))
    )
    .returning();

  return result.length;
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string) {
  const [job] = await db
    .select()
    .from(syncJobs)
    .where(eq(syncJobs.id, jobId))
    .limit(1);

  return job || null;
}

/**
 * Get all jobs for an account
 */
export async function getAccountJobs(accountId: string, limit: number = 10) {
  return await db
    .select()
    .from(syncJobs)
    .where(eq(syncJobs.accountId, accountId))
    .orderBy(asc(syncJobs.createdAt))
    .limit(limit);
}

/**
 * Clean up old completed jobs (retention policy)
 */
export async function cleanupOldJobs(
  olderThanDays: number = 7
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await db
    .delete(syncJobs)
    .where(
      and(
        eq(syncJobs.status, 'completed'),
        lte(syncJobs.completedAt!, cutoffDate)
      )
    )
    .returning();

  return result.length;
}
