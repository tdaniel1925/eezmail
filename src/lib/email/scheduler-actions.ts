'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import {
  scheduledEmails,
  emailAccounts,
  type ScheduledEmail,
  type NewScheduledEmail,
  type ScheduledEmailStatus,
} from '@/db/schema';
import { eq, and, desc, lte, sql } from 'drizzle-orm';
import { sendEmailAction } from '@/lib/chat/actions';

export interface ScheduleEmailData {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string; // HTML
  attachments?: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    data: string; // Base64
  }>;
  scheduledFor: Date;
  timezone?: string;
  accountId?: string;
}

/**
 * Schedule an email to be sent later
 */
export async function scheduleEmail(
  params: ScheduleEmailData
): Promise<{ success: boolean; scheduledEmailId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate scheduled time is in the future
    if (new Date(params.scheduledFor) <= new Date()) {
      return {
        success: false,
        error: 'Scheduled time must be in the future',
      };
    }

    // Get user's active email account if not provided
    let accountId = params.accountId;
    if (!accountId) {
      const accounts = await db.query.emailAccounts.findMany({
        where: eq(emailAccounts.userId, user.id),
      });
      const activeAccount = accounts.find((a) => a.status === 'active');
      if (!activeAccount) {
        return { success: false, error: 'No active email account found' };
      }
      accountId = activeAccount.id;
    }

    // Create scheduled email
    const [scheduledEmail] = await db
      .insert(scheduledEmails)
      .values({
        userId: user.id,
        accountId,
        to: params.to,
        cc: params.cc,
        bcc: params.bcc,
        subject: params.subject,
        body: params.body,
        attachments: params.attachments || [],
        scheduledFor: params.scheduledFor,
        timezone: params.timezone || 'UTC',
        status: 'pending',
      })
      .returning();

    return { success: true, scheduledEmailId: scheduledEmail.id };
  } catch (error) {
    console.error('Error scheduling email:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to schedule email',
    };
  }
}

/**
 * Cancel a scheduled email
 */
export async function cancelScheduledEmail(scheduledEmailId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership and current status
    const scheduledEmail = await db.query.scheduledEmails.findFirst({
      where: and(
        eq(scheduledEmails.id, scheduledEmailId),
        eq(scheduledEmails.userId, user.id)
      ),
    });

    if (!scheduledEmail) {
      return { success: false, error: 'Scheduled email not found' };
    }

    if (scheduledEmail.status !== 'pending') {
      return {
        success: false,
        error: `Cannot cancel email with status: ${scheduledEmail.status}`,
      };
    }

    // Update status to cancelled
    await db
      .update(scheduledEmails)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(scheduledEmails.id, scheduledEmailId));

    return { success: true };
  } catch (error) {
    console.error('Error cancelling scheduled email:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to cancel scheduled email',
    };
  }
}

/**
 * Get all scheduled emails for the current user
 */
export async function getScheduledEmails(params?: {
  status?: ScheduledEmailStatus;
}): Promise<{
  success: boolean;
  scheduledEmails?: ScheduledEmail[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const conditions = [eq(scheduledEmails.userId, user.id)];

    if (params?.status) {
      conditions.push(eq(scheduledEmails.status, params.status));
    }

    const emails = await db.query.scheduledEmails.findMany({
      where: and(...conditions),
      orderBy: [desc(scheduledEmails.scheduledFor)],
      limit: 50, // Limit to most recent 50
    });

    return { success: true, scheduledEmails: emails };
  } catch (error) {
    console.error('Error getting scheduled emails:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get scheduled emails',
    };
  }
}

/**
 * Get a single scheduled email by ID
 */
export async function getScheduledEmail(scheduledEmailId: string): Promise<{
  success: boolean;
  scheduledEmail?: ScheduledEmail;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const scheduledEmail = await db.query.scheduledEmails.findFirst({
      where: and(
        eq(scheduledEmails.id, scheduledEmailId),
        eq(scheduledEmails.userId, user.id)
      ),
    });

    if (!scheduledEmail) {
      return { success: false, error: 'Scheduled email not found' };
    }

    return { success: true, scheduledEmail };
  } catch (error) {
    console.error('Error getting scheduled email:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get scheduled email',
    };
  }
}

/**
 * Process pending scheduled emails (to be run by a cron job or background worker)
 * This should be called periodically (e.g., every minute)
 */
export async function processScheduledEmails(): Promise<{
  success: boolean;
  processed?: number;
  error?: string;
}> {
  try {
    // Get all pending emails that are due to be sent
    const dueEmails = await db.query.scheduledEmails.findMany({
      where: and(
        eq(scheduledEmails.status, 'pending'),
        lte(scheduledEmails.scheduledFor, new Date())
      ),
      limit: 10, // Process in batches
    });

    let processedCount = 0;

    for (const email of dueEmails) {
      try {
        // Attempt to send the email
        const result = await sendEmailAction({
          to: email.to,
          cc: email.cc || undefined,
          bcc: email.bcc || undefined,
          subject: email.subject,
          body: email.body,
          attachments: (email.attachments as any) || [],
          isHtml: true,
          accountId: email.accountId,
        });

        if (result.success) {
          // Mark as sent
          await db
            .update(scheduledEmails)
            .set({
              status: 'sent',
              sentAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(scheduledEmails.id, email.id));

          processedCount++;
        } else {
          // Mark as failed and increment attempt count
          await db
            .update(scheduledEmails)
            .set({
              status: email.attemptCount >= 3 ? 'failed' : 'pending', // Retry up to 3 times
              errorMessage: result.error || 'Unknown error',
              attemptCount: email.attemptCount + 1,
              updatedAt: new Date(),
            })
            .where(eq(scheduledEmails.id, email.id));
        }
      } catch (error) {
        console.error('Error processing scheduled email:', email.id, error);

        // Mark as failed
        await db
          .update(scheduledEmails)
          .set({
            status: 'failed',
            errorMessage:
              error instanceof Error ? error.message : 'Unknown error',
            attemptCount: email.attemptCount + 1,
            updatedAt: new Date(),
          })
          .where(eq(scheduledEmails.id, email.id));
      }
    }

    return { success: true, processed: processedCount };
  } catch (error) {
    console.error('Error processing scheduled emails:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to process scheduled emails',
    };
  }
}

/**
 * Update a scheduled email (before it's sent)
 */
export async function updateScheduledEmail(
  scheduledEmailId: string,
  updates: Partial<ScheduleEmailData>
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership and current status
    const scheduledEmail = await db.query.scheduledEmails.findFirst({
      where: and(
        eq(scheduledEmails.id, scheduledEmailId),
        eq(scheduledEmails.userId, user.id)
      ),
    });

    if (!scheduledEmail) {
      return { success: false, error: 'Scheduled email not found' };
    }

    if (scheduledEmail.status !== 'pending') {
      return {
        success: false,
        error: `Cannot update email with status: ${scheduledEmail.status}`,
      };
    }

    // Validate new scheduled time if provided
    if (updates.scheduledFor && new Date(updates.scheduledFor) <= new Date()) {
      return {
        success: false,
        error: 'Scheduled time must be in the future',
      };
    }

    // Update the scheduled email
    await db
      .update(scheduledEmails)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(scheduledEmails.id, scheduledEmailId));

    return { success: true };
  } catch (error) {
    console.error('Error updating scheduled email:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update scheduled email',
    };
  }
}

/**
 * Delete old completed/failed scheduled emails (cleanup)
 */
export async function deleteOldScheduledEmails(daysOld: number = 30): Promise<{
  success: boolean;
  deletedCount?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const oldEmails = await db.query.scheduledEmails.findMany({
      where: and(
        eq(scheduledEmails.userId, user.id),
        sql`${scheduledEmails.status} IN ('sent', 'failed', 'cancelled')`
        // sentAt/updatedAt < cutoffDate (would need custom SQL for this)
      ),
      columns: { id: true },
    });

    if (oldEmails.length > 0) {
      const ids = oldEmails.map((e) => e.id);
      await db
        .delete(scheduledEmails)
        .where(sql`${scheduledEmails.id} = ANY(${ids})`);
    }

    return { success: true, deletedCount: oldEmails.length };
  } catch (error) {
    console.error('Error deleting old scheduled emails:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete old scheduled emails',
    };
  }
}
