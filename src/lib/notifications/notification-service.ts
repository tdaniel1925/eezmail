'use server';

import { Resend } from 'resend';
import { db } from '@/lib/db';
import {
  notificationTemplates,
  notificationQueue,
  users,
  subscriptions,
} from '@/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);

// ============================================================================
// TYPES
// ============================================================================

export interface SendNotificationParams {
  templateSlug: string;
  recipientId: string;
  variables?: Record<string, string>;
  scheduledFor?: Date;
  overrides?: {
    subject?: string;
    fromName?: string;
    fromEmail?: string;
  };
}

export interface SendBulkNotificationParams {
  templateSlug: string;
  recipientIds: string[];
  variables?: Record<string, string>;
  scheduledFor?: Date;
}

export interface NotificationResult {
  success: boolean;
  queueId?: string;
  externalId?: string;
  error?: string;
}

// ============================================================================
// VARIABLE SUBSTITUTION
// ============================================================================

function substituteVariables(
  content: string,
  variables: Record<string, string>
): string {
  let result = content;

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(placeholder, value || '');
  });

  return result;
}

// ============================================================================
// GET USER WITH SUBSCRIPTION INFO
// ============================================================================

async function getUserWithSubscription(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
      sandboxCompanyId: users.sandboxCompanyId,
      subscriptionTier: subscriptions.tier,
    })
    .from(users)
    .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);

  return user;
}

// ============================================================================
// GET TEMPLATE WITH AUDIENCE CHECK
// ============================================================================

async function getTemplateForUser(
  templateSlug: string,
  userRole: string | null,
  subscriptionTier: string | null,
  isSandboxUser: boolean
) {
  const [template] = await db
    .select()
    .from(notificationTemplates)
    .where(
      and(
        eq(notificationTemplates.slug, templateSlug),
        eq(notificationTemplates.status, 'active')
      )
    )
    .limit(1);

  if (!template) {
    throw new Error(`Template not found: ${templateSlug}`);
  }

  // Check if template audience matches user
  const { audience } = template;

  if (audience === 'all') return template;
  if (audience === 'sandbox' && isSandboxUser) return template;
  if (
    audience === 'admin' &&
    (userRole === 'admin' || userRole === 'super_admin')
  )
    return template;
  if (audience === subscriptionTier) return template;

  throw new Error(`User is not eligible for template audience: ${audience}`);
}

// ============================================================================
// APPLY PERSONALIZATION RULES
// ============================================================================

function applyPersonalizationRules(
  htmlContent: string,
  textContent: string | null,
  personalizationRules: any,
  subscriptionTier: string | null,
  isSandboxUser: boolean
): { html: string; text: string } {
  let html = htmlContent;
  let text = textContent || '';

  // Apply tier-specific rules
  if (isSandboxUser && personalizationRules?.sandbox) {
    Object.entries(personalizationRules.sandbox).forEach(([key, value]) => {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
      text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
    });
  } else if (subscriptionTier && personalizationRules?.[subscriptionTier]) {
    Object.entries(personalizationRules[subscriptionTier]).forEach(
      ([key, value]) => {
        html = html.replace(
          new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
          String(value)
        );
        text = text.replace(
          new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
          String(value)
        );
      }
    );
  }

  return { html, text };
}

// ============================================================================
// SEND NOTIFICATION (SINGLE)
// ============================================================================

export async function sendNotification(
  params: SendNotificationParams
): Promise<NotificationResult> {
  try {
    // Authenticate
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      throw new Error('Unauthorized');
    }

    // Get recipient info
    const recipient = await getUserWithSubscription(params.recipientId);

    if (!recipient) {
      throw new Error('Recipient not found');
    }

    // Get template
    const isSandboxUser = !!recipient.sandboxCompanyId;
    const template = await getTemplateForUser(
      params.templateSlug,
      recipient.role,
      recipient.subscriptionTier,
      isSandboxUser
    );

    // Prepare variables
    const defaultVariables: Record<string, string> = {
      userName: recipient.fullName || recipient.email,
      userEmail: recipient.email,
      currentYear: new Date().getFullYear().toString(),
      supportEmail: process.env.SUPPORT_EMAIL || 'support@easemail.ai',
      dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      loginLink: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`,
    };

    const allVariables = { ...defaultVariables, ...params.variables };

    // Apply personalization rules
    const { html: personalizedHtml, text: personalizedText } =
      applyPersonalizationRules(
        template.htmlContent,
        template.textContent,
        template.personalizationRules,
        recipient.subscriptionTier,
        isSandboxUser
      );

    // Substitute variables
    const subject = substituteVariables(
      params.overrides?.subject || template.subject,
      allVariables
    );
    const htmlContent = substituteVariables(personalizedHtml, allVariables);
    const textContent = substituteVariables(personalizedText, allVariables);

    // Add to queue
    const [queueItem] = await db
      .insert(notificationQueue)
      .values({
        templateId: template.id,
        recipientId: recipient.id,
        recipientEmail: recipient.email,
        recipientName: recipient.fullName,
        subject,
        htmlContent,
        textContent,
        variables: allVariables,
        status: params.scheduledFor ? 'pending' : 'pending',
        scheduledFor: params.scheduledFor,
      })
      .returning();

    // If not scheduled, send immediately
    if (!params.scheduledFor) {
      const result = await sendQueuedEmail(queueItem.id);
      return result;
    }

    // Update template usage
    await db
      .update(notificationTemplates)
      .set({
        useCount: sql`${notificationTemplates.useCount} + 1`,
        lastUsedAt: new Date(),
      })
      .where(eq(notificationTemplates.id, template.id));

    return {
      success: true,
      queueId: queueItem.id,
    };
  } catch (error) {
    console.error(
      '❌ [Notification Service] Error sending notification:',
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// SEND BULK NOTIFICATIONS
// ============================================================================

export async function sendBulkNotification(
  params: SendBulkNotificationParams
): Promise<{
  success: boolean;
  sent: number;
  failed: number;
  results: NotificationResult[];
}> {
  const results: NotificationResult[] = [];
  let sent = 0;
  let failed = 0;

  for (const recipientId of params.recipientIds) {
    const result = await sendNotification({
      templateSlug: params.templateSlug,
      recipientId,
      variables: params.variables,
      scheduledFor: params.scheduledFor,
    });

    results.push(result);

    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return {
    success: failed === 0,
    sent,
    failed,
    results,
  };
}

// ============================================================================
// SEND QUEUED EMAIL (via Resend)
// ============================================================================

export async function sendQueuedEmail(
  queueId: string
): Promise<NotificationResult> {
  try {
    // Get queue item
    const [queueItem] = await db
      .select()
      .from(notificationQueue)
      .where(eq(notificationQueue.id, queueId))
      .limit(1);

    if (!queueItem) {
      throw new Error('Queue item not found');
    }

    // Get template for sender info
    const [template] = await db
      .select()
      .from(notificationTemplates)
      .where(eq(notificationTemplates.id, queueItem.templateId))
      .limit(1);

    if (!template) {
      throw new Error('Template not found');
    }

    // Send via Resend
    const { data, error } = await resend.emails.send({
      from:
        template.fromEmail && template.fromName
          ? `${template.fromName} <${template.fromEmail}>`
          : `EaseMail <noreply@easemail.ai>`,
      to: queueItem.recipientEmail,
      subject: queueItem.subject,
      html: queueItem.htmlContent,
      text: queueItem.textContent || undefined,
      replyTo: template.replyToEmail || undefined,
    });

    if (error) {
      // Update queue with error
      await db
        .update(notificationQueue)
        .set({
          status: 'failed',
          errorMessage: error.message,
          errorCode: error.name,
          deliveryAttempts: sql`${notificationQueue.deliveryAttempts} + 1`,
          lastAttemptAt: new Date(),
        })
        .where(eq(notificationQueue.id, queueId));

      console.error('❌ [Resend] Error sending email:', error);

      return {
        success: false,
        error: error.message,
      };
    }

    // Update queue with success
    await db
      .update(notificationQueue)
      .set({
        status: 'sent',
        externalId: data?.id,
        sentAt: new Date(),
        deliveryAttempts: sql`${notificationQueue.deliveryAttempts} + 1`,
        lastAttemptAt: new Date(),
      })
      .where(eq(notificationQueue.id, queueId));

    console.log(
      `✅ [Resend] Email sent successfully to ${queueItem.recipientEmail}`,
      data
    );

    return {
      success: true,
      queueId,
      externalId: data?.id,
    };
  } catch (error) {
    console.error(
      '❌ [Notification Service] Error sending queued email:',
      error
    );

    // Update queue with error
    await db
      .update(notificationQueue)
      .set({
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        deliveryAttempts: sql`${notificationQueue.deliveryAttempts} + 1`,
        lastAttemptAt: new Date(),
      })
      .where(eq(notificationQueue.id, queueId));

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// PROCESS SCHEDULED NOTIFICATIONS (run via cron/inngest)
// ============================================================================

export async function processScheduledNotifications(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  console.log(
    '🔍 [Notification Service] Processing scheduled notifications...'
  );

  // Get all pending notifications that are due
  const dueNotifications = await db
    .select()
    .from(notificationQueue)
    .where(
      and(
        eq(notificationQueue.status, 'pending'),
        sql`${notificationQueue.scheduledFor} <= NOW()`
      )
    )
    .limit(100); // Process 100 at a time

  console.log(
    `📧 [Notification Service] Found ${dueNotifications.length} notifications to send`
  );

  let sent = 0;
  let failed = 0;

  for (const notification of dueNotifications) {
    const result = await sendQueuedEmail(notification.id);

    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  console.log(
    `✅ [Notification Service] Processed ${dueNotifications.length} notifications: ${sent} sent, ${failed} failed`
  );

  return {
    processed: dueNotifications.length,
    sent,
    failed,
  };
}

// ============================================================================
// RETRY FAILED NOTIFICATIONS
// ============================================================================

export async function retryFailedNotifications(
  maxAttempts: number = 3
): Promise<{
  retried: number;
  sent: number;
  failed: number;
}> {
  console.log('🔄 [Notification Service] Retrying failed notifications...');

  // Get failed notifications that haven't exceeded max attempts
  const failedNotifications = await db
    .select()
    .from(notificationQueue)
    .where(
      and(
        eq(notificationQueue.status, 'failed'),
        sql`${notificationQueue.deliveryAttempts} < ${maxAttempts}`
      )
    )
    .limit(50); // Retry 50 at a time

  console.log(
    `📧 [Notification Service] Found ${failedNotifications.length} notifications to retry`
  );

  let sent = 0;
  let failed = 0;

  for (const notification of failedNotifications) {
    const result = await sendQueuedEmail(notification.id);

    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  console.log(
    `✅ [Notification Service] Retried ${failedNotifications.length} notifications: ${sent} sent, ${failed} failed`
  );

  return {
    retried: failedNotifications.length,
    sent,
    failed,
  };
}

// ============================================================================
// GET NOTIFICATION STATS
// ============================================================================

export async function getNotificationStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const [stats] = await db
    .select({
      totalSent: sql<number>`COUNT(*) FILTER (WHERE status IN ('sent', 'delivered'))`,
      totalPending: sql<number>`COUNT(*) FILTER (WHERE status = 'pending')`,
      totalFailed: sql<number>`COUNT(*) FILTER (WHERE status = 'failed')`,
      totalOpened: sql<number>`COUNT(*) FILTER (WHERE opened_at IS NOT NULL)`,
      totalClicked: sql<number>`COUNT(*) FILTER (WHERE clicked_at IS NOT NULL)`,
    })
    .from(notificationQueue);

  return stats;
}
