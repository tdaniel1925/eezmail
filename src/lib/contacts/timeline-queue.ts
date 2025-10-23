/**
 * Contact Timeline Queue Service
 * Non-blocking queue for logging email events to contact timelines
 * Prevents slow database lookups from blocking email sync
 */

'use server';

import { db } from '@/lib/db';
import { contactTimelineQueue } from '@/db/schema';
import { eq, and, lte, or } from 'drizzle-orm';
import { logEmailReceived } from '@/lib/contacts/timeline-actions';
import { findContactByEmail } from '@/lib/contacts/helpers';

/**
 * Queue a contact timeline event (non-blocking)
 * Called during email sync instead of awaiting logEmailReceived()
 */
export async function queueContactTimelineEvent(params: {
  emailId: string;
  userId: string;
  senderEmail: string;
  subject: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if already queued or completed
    const existing = await db
      .select()
      .from(contactTimelineQueue)
      .where(
        and(
          eq(contactTimelineQueue.emailId, params.emailId),
          or(
            eq(contactTimelineQueue.status, 'pending'),
            eq(contactTimelineQueue.status, 'processing'),
            eq(contactTimelineQueue.status, 'completed')
          )
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Already queued or processed, skip
      return { success: true };
    }

    // Queue for processing
    await db.insert(contactTimelineQueue).values({
      emailId: params.emailId,
      userId: params.userId,
      senderEmail: params.senderEmail,
      subject: params.subject,
      status: 'pending',
      attempts: 0,
    });

    return { success: true };
  } catch (error) {
    console.error('Error queueing contact timeline event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process pending timeline events in batch
 * Called by cron job every 30 seconds
 */
export async function processContactTimelineQueue(
  batchSize: number = 20
): Promise<{
  success: boolean;
  processed: number;
  failed: number;
  error?: string;
}> {
  try {
    // Get pending jobs ordered by created date
    const pendingJobs = await db
      .select()
      .from(contactTimelineQueue)
      .where(eq(contactTimelineQueue.status, 'pending'))
      .orderBy(contactTimelineQueue.createdAt)
      .limit(batchSize);

    if (pendingJobs.length === 0) {
      return { success: true, processed: 0, failed: 0 };
    }

    console.log(`📊 Processing ${pendingJobs.length} contact timeline events...`);

    let processed = 0;
    let failed = 0;

    for (const job of pendingJobs) {
      try {
        // Mark as processing
        await db
          .update(contactTimelineQueue)
          .set({
            status: 'processing',
            lastAttemptAt: new Date(),
            attempts: job.attempts + 1,
          })
          .where(eq(contactTimelineQueue.id, job.id));

        // Find contact by email
        const contactId = await findContactByEmail(job.senderEmail);

        if (contactId) {
          // Log to contact timeline
          await logEmailReceived(contactId, job.subject, job.emailId);

          // Mark as completed
          await db
            .update(contactTimelineQueue)
            .set({
              status: 'completed',
              processedAt: new Date(),
            })
            .where(eq(contactTimelineQueue.id, job.id));

          processed++;
          console.log(
            `✅ Logged email to contact timeline for ${job.senderEmail}`
          );
        } else {
          // No contact found, mark as completed (not an error)
          await db
            .update(contactTimelineQueue)
            .set({
              status: 'completed',
              processedAt: new Date(),
            })
            .where(eq(contactTimelineQueue.id, job.id));

          processed++;
          console.log(
            `⏭️  No contact found for ${job.senderEmail}, skipping timeline log`
          );
        }
      } catch (error) {
        console.error(
          `❌ Failed to process contact timeline event for ${job.senderEmail}:`,
          error
        );

        // Mark as failed if too many attempts
        const maxAttempts = 3;
        if (job.attempts + 1 >= maxAttempts) {
          await db
            .update(contactTimelineQueue)
            .set({
              status: 'failed',
              errorMessage:
                error instanceof Error ? error.message : 'Unknown error',
            })
            .where(eq(contactTimelineQueue.id, job.id));
          failed++;
        } else {
          // Reset to pending for retry
          await db
            .update(contactTimelineQueue)
            .set({
              status: 'pending',
              errorMessage:
                error instanceof Error ? error.message : 'Unknown error',
            })
            .where(eq(contactTimelineQueue.id, job.id));
        }
      }
    }

    console.log(
      `📊 Timeline queue processed: ${processed} successful, ${failed} failed`
    );

    return { success: true, processed, failed };
  } catch (error) {
    console.error('Error processing contact timeline queue:', error);
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
export async function cleanupContactTimelineQueue(): Promise<{
  success: boolean;
  deleted: number;
  error?: string;
}> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    await db
      .delete(contactTimelineQueue)
      .where(
        and(
          or(
            eq(contactTimelineQueue.status, 'completed'),
            eq(contactTimelineQueue.status, 'failed')
          ),
          lte(contactTimelineQueue.createdAt, sevenDaysAgo)
        )
      );

    console.log(`🧹 Cleaned up old contact timeline queue jobs`);

    return { success: true, deleted: 0 };
  } catch (error) {
    console.error('Error cleaning up contact timeline queue:', error);
    return {
      success: false,
      deleted: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get timeline queue statistics
 */
export async function getContactTimelineQueueStats(): Promise<{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}> {
  try {
    const [pending, processing, completed, failed] = await Promise.all([
      db
        .select()
        .from(contactTimelineQueue)
        .where(eq(contactTimelineQueue.status, 'pending')),
      db
        .select()
        .from(contactTimelineQueue)
        .where(eq(contactTimelineQueue.status, 'processing')),
      db
        .select()
        .from(contactTimelineQueue)
        .where(eq(contactTimelineQueue.status, 'completed')),
      db
        .select()
        .from(contactTimelineQueue)
        .where(eq(contactTimelineQueue.status, 'failed')),
    ]);

    return {
      pending: pending.length,
      processing: processing.length,
      completed: completed.length,
      failed: failed.length,
    };
  } catch (error) {
    console.error('Error getting contact timeline queue stats:', error);
    return { pending: 0, processing: 0, completed: 0, failed: 0 };
  }
}

/**
 * Retry failed jobs
 */
export async function retryFailedTimelineEvents(
  limit: number = 50
): Promise<{ success: boolean; retried: number; error?: string }> {
  try {
    const failedJobs = await db
      .select()
      .from(contactTimelineQueue)
      .where(eq(contactTimelineQueue.status, 'failed'))
      .limit(limit);

    for (const job of failedJobs) {
      await db
        .update(contactTimelineQueue)
        .set({
          status: 'pending',
          attempts: 0,
          errorMessage: null,
        })
        .where(eq(contactTimelineQueue.id, job.id));
    }

    console.log(
      `🔄 Reset ${failedJobs.length} failed timeline events to pending`
    );

    return { success: true, retried: failedJobs.length };
  } catch (error) {
    console.error('Error retrying failed timeline events:', error);
    return {
      success: false,
      retried: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

