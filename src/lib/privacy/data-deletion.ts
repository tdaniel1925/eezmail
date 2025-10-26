/**
 * GDPR Data Deletion Service
 * Implement right to be forgotten (GDPR Article 17)
 */

import { db } from '@/db';
import {
  users,
  userSettings,
  emailAccounts,
  emails,
  emailAttachments,
  contacts,
  auditLogs,
  supportTickets,
  orders,
  subscriptions,
  notifications,
  emailDrafts,
} from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export interface DeletionOptions {
  anonymizeAuditLogs: boolean; // Keep logs but anonymize for compliance
  deleteImmediately: boolean; // Skip grace period
  reason?: string;
}

export interface DeletionReport {
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  deletedRecords: Record<string, number>;
  errors: string[];
  status: 'in_progress' | 'completed' | 'failed';
}

/**
 * Delete all user data (Right to be Forgotten)
 */
export async function deleteUserData(
  userId: string,
  options: DeletionOptions
): Promise<DeletionReport> {
  const report: DeletionReport = {
    userId,
    startedAt: new Date(),
    deletedRecords: {},
    errors: [],
    status: 'in_progress',
  };

  try {
    // Delete in order of dependencies (child tables first)

    // 1. Email-related data
    const deletedDrafts = await db
      .delete(emailDrafts)
      .where(eq(emailDrafts.userId, userId))
      .returning();
    report.deletedRecords['email_drafts'] = deletedDrafts.length;

    const deletedAttachments = await db
      .delete(emailAttachments)
      .where(eq(emailAttachments.userId, userId))
      .returning();
    report.deletedRecords['email_attachments'] = deletedAttachments.length;

    const deletedEmails = await db
      .delete(emails)
      .where(eq(emails.userId, userId))
      .returning();
    report.deletedRecords['emails'] = deletedEmails.length;

    const deletedAccounts = await db
      .delete(emailAccounts)
      .where(eq(emailAccounts.userId, userId))
      .returning();
    report.deletedRecords['email_accounts'] = deletedAccounts.length;

    // 2. Contacts
    const deletedContacts = await db
      .delete(contacts)
      .where(eq(contacts.userId, userId))
      .returning();
    report.deletedRecords['contacts'] = deletedContacts.length;

    // 3. Notifications
    const deletedNotifications = await db
      .delete(notifications)
      .where(eq(notifications.userId, userId))
      .returning();
    report.deletedRecords['notifications'] = deletedNotifications.length;

    // 4. Support tickets
    const deletedTickets = await db
      .delete(supportTickets)
      .where(eq(supportTickets.userId, userId))
      .returning();
    report.deletedRecords['support_tickets'] = deletedTickets.length;

    // 5. Orders and subscriptions
    const deletedOrders = await db
      .delete(orders)
      .where(eq(orders.userId, userId))
      .returning();
    report.deletedRecords['orders'] = deletedOrders.length;

    const deletedSubscriptions = await db
      .delete(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .returning();
    report.deletedRecords['subscriptions'] = deletedSubscriptions.length;

    // 6. User settings
    const deletedSettings = await db
      .delete(userSettings)
      .where(eq(userSettings.userId, userId))
      .returning();
    report.deletedRecords['user_settings'] = deletedSettings.length;

    // 7. Audit logs (anonymize or delete based on options)
    if (options.anonymizeAuditLogs) {
      // Anonymize instead of delete for compliance
      const anonymizedLogs = await db
        .update(auditLogs)
        .set({
          actorEmail: '[DELETED]',
          ipAddress: null,
          userAgent: null,
          metadata: sql`jsonb_build_object('anonymized', true)`,
        })
        .where(eq(auditLogs.actorId, userId))
        .returning();
      report.deletedRecords['audit_logs_anonymized'] = anonymizedLogs.length;
    } else {
      const deletedLogs = await db
        .delete(auditLogs)
        .where(eq(auditLogs.actorId, userId))
        .returning();
      report.deletedRecords['audit_logs'] = deletedLogs.length;
    }

    // 8. Finally, delete user account
    const deletedUsers = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning();
    report.deletedRecords['users'] = deletedUsers.length;

    report.completedAt = new Date();
    report.status = 'completed';
  } catch (error) {
    report.status = 'failed';
    report.errors.push(
      error instanceof Error ? error.message : 'Unknown error'
    );
  }

  return report;
}

/**
 * Verify deletion was successful
 */
export async function verifyDeletion(userId: string): Promise<{
  fullyDeleted: boolean;
  remainingRecords: Record<string, number>;
}> {
  const checks = {
    users: await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.id, userId)),
    emails: await db
      .select({ count: sql<number>`count(*)::int` })
      .from(emails)
      .where(eq(emails.userId, userId)),
    emailAccounts: await db
      .select({ count: sql<number>`count(*)::int` })
      .from(emailAccounts)
      .where(eq(emailAccounts.userId, userId)),
    contacts: await db
      .select({ count: sql<number>`count(*)::int` })
      .from(contacts)
      .where(eq(contacts.userId, userId)),
  };

  const remainingRecords: Record<string, number> = {};
  let hasRemaining = false;

  for (const [table, result] of Object.entries(checks)) {
    const count = result[0].count;
    if (count > 0) {
      remainingRecords[table] = count;
      hasRemaining = true;
    }
  }

  return {
    fullyDeleted: !hasRemaining,
    remainingRecords,
  };
}

/**
 * Track deletion request
 */
export interface DeletionRequest {
  id: string;
  userId: string;
  reason?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: Date;
  scheduledFor: Date; // Grace period
  completedAt?: Date;
  report?: DeletionReport;
}

export async function createDeletionRequest(
  userId: string,
  reason?: string
): Promise<DeletionRequest> {
  // Grace period: 30 days
  const gracePeriod = 30 * 24 * 60 * 60 * 1000;
  const scheduledFor = new Date(Date.now() + gracePeriod);

  const request: DeletionRequest = {
    id: crypto.randomUUID(),
    userId,
    reason,
    status: 'pending',
    requestedAt: new Date(),
    scheduledFor,
  };

  // TODO: Store in database and queue background job

  return request;
}

export async function cancelDeletionRequest(
  requestId: string
): Promise<boolean> {
  // TODO: Implement cancellation logic
  return true;
}
