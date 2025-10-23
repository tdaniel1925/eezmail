/**
 * RAG Embedding Queue Service
 * Non-blocking queue for generating email embeddings in the background
 * Prevents slow AI operations from blocking email sync
 */

'use server';

import { db } from '@/lib/db';
import { embeddingQueue, emails } from '@/db/schema';
import { eq, and, lte, or } from 'drizzle-orm';
import { embedEmail } from '@/lib/rag/embedding-pipeline';

/**
 * Queue an email for embedding generation (non-blocking)
 * Called during email sync instead of awaiting embedEmail()
 */
export async function queueEmbeddingJob(
  emailId: string,
  userId: string,
  priority: number = 0
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if already queued or completed
    const existing = await db
      .select()
      .from(embeddingQueue)
      .where(
        and(
          eq(embeddingQueue.emailId, emailId),
          or(
            eq(embeddingQueue.status, 'pending'),
            eq(embeddingQueue.status, 'processing'),
            eq(embeddingQueue.status, 'completed')
          )
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Already queued or processed, skip
      return { success: true };
    }

    // Queue for processing
    await db.insert(embeddingQueue).values({
      emailId,
      userId,
      priority,
      status: 'pending',
      attempts: 0,
    });

    return { success: true };
  } catch (error) {
    console.error('Error queueing embedding job:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process pending embedding jobs in batch
 * Called by cron job every 30 seconds
 */
export async function processEmbeddingQueue(
  batchSize: number = 10
): Promise<{
  success: boolean;
  processed: number;
  failed: number;
  error?: string;
}> {
  try {
    // Get pending jobs ordered by priority (highest first) and created date
    const pendingJobs = await db
      .select()
      .from(embeddingQueue)
      .where(eq(embeddingQueue.status, 'pending'))
      .orderBy(embeddingQueue.priority, embeddingQueue.createdAt)
      .limit(batchSize);

    if (pendingJobs.length === 0) {
      return { success: true, processed: 0, failed: 0 };
    }

    console.log(`📊 Processing ${pendingJobs.length} embedding jobs...`);

    let processed = 0;
    let failed = 0;

    for (const job of pendingJobs) {
      try {
        // Mark as processing
        await db
          .update(embeddingQueue)
          .set({
            status: 'processing',
            lastAttemptAt: new Date(),
            attempts: job.attempts + 1,
          })
          .where(eq(embeddingQueue.id, job.id));

        // Generate embedding
        await embedEmail(job.emailId);

        // Mark as completed
        await db
          .update(embeddingQueue)
          .set({
            status: 'completed',
            processedAt: new Date(),
          })
          .where(eq(embeddingQueue.id, job.id));

        processed++;
        console.log(`✅ Embedding generated for email ${job.emailId}`);
      } catch (error) {
        console.error(
          `❌ Failed to generate embedding for email ${job.emailId}:`,
          error
        );

        // Mark as failed if too many attempts
        const maxAttempts = 3;
        if (job.attempts + 1 >= maxAttempts) {
          await db
            .update(embeddingQueue)
            .set({
              status: 'failed',
              errorMessage:
                error instanceof Error ? error.message : 'Unknown error',
            })
            .where(eq(embeddingQueue.id, job.id));
          failed++;
        } else {
          // Reset to pending for retry
          await db
            .update(embeddingQueue)
            .set({
              status: 'pending',
              errorMessage:
                error instanceof Error ? error.message : 'Unknown error',
            })
            .where(eq(embeddingQueue.id, job.id));
        }
      }
    }

    console.log(
      `📊 Embedding queue processed: ${processed} successful, ${failed} failed`
    );

    return { success: true, processed, failed };
  } catch (error) {
    console.error('Error processing embedding queue:', error);
    return {
      success: false,
      processed: 0,
      failed: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Clean up old completed/failed jobs (older than 7 days)
 * Called by cron job daily
 */
export async function cleanupEmbeddingQueue(): Promise<{
  success: boolean;
  deleted: number;
  error?: string;
}> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const result = await db
      .delete(embeddingQueue)
      .where(
        and(
          or(
            eq(embeddingQueue.status, 'completed'),
            eq(embeddingQueue.status, 'failed')
          ),
          lte(embeddingQueue.createdAt, sevenDaysAgo)
        )
      );

    console.log(`🧹 Cleaned up old embedding queue jobs`);

    return { success: true, deleted: 0 }; // Drizzle doesn't return count for delete
  } catch (error) {
    console.error('Error cleaning up embedding queue:', error);
    return {
      success: false,
      deleted: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get embedding queue statistics
 */
export async function getEmbeddingQueueStats(): Promise<{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}> {
  try {
    const [pending, processing, completed, failed] = await Promise.all([
      db
        .select()
        .from(embeddingQueue)
        .where(eq(embeddingQueue.status, 'pending')),
      db
        .select()
        .from(embeddingQueue)
        .where(eq(embeddingQueue.status, 'processing')),
      db
        .select()
        .from(embeddingQueue)
        .where(eq(embeddingQueue.status, 'completed')),
      db
        .select()
        .from(embeddingQueue)
        .where(eq(embeddingQueue.status, 'failed')),
    ]);

    return {
      pending: pending.length,
      processing: processing.length,
      completed: completed.length,
      failed: failed.length,
    };
  } catch (error) {
    console.error('Error getting embedding queue stats:', error);
    return { pending: 0, processing: 0, completed: 0, failed: 0 };
  }
}

/**
 * Retry failed jobs
 */
export async function retryFailedEmbeddings(
  limit: number = 50
): Promise<{ success: boolean; retried: number; error?: string }> {
  try {
    const failedJobs = await db
      .select()
      .from(embeddingQueue)
      .where(eq(embeddingQueue.status, 'failed'))
      .limit(limit);

    for (const job of failedJobs) {
      await db
        .update(embeddingQueue)
        .set({
          status: 'pending',
          attempts: 0,
          errorMessage: null,
        })
        .where(eq(embeddingQueue.id, job.id));
    }

    console.log(`🔄 Reset ${failedJobs.length} failed embedding jobs to pending`);

    return { success: true, retried: failedJobs.length };
  } catch (error) {
    console.error('Error retrying failed embeddings:', error);
    return {
      success: false,
      retried: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

