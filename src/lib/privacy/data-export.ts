/**
 * GDPR Data Export Service
 * Export all user data in compliance with GDPR Article 15
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
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import JSZip from 'jszip';

export interface UserDataExport {
  exportDate: string;
  userId: string;
  profile: unknown;
  settings: unknown;
  emailAccounts: unknown[];
  emails: unknown[];
  attachments: unknown[];
  contacts: unknown[];
  auditLogs: unknown[];
  supportTickets: unknown[];
  orders: unknown[];
  subscriptions: unknown[];
}

/**
 * Export all data for a user
 */
export async function exportUserData(userId: string): Promise<UserDataExport> {
  // Fetch all user data from different tables
  const [userProfile] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  const accounts = await db
    .select()
    .from(emailAccounts)
    .where(eq(emailAccounts.userId, userId));

  const userEmails = await db
    .select()
    .from(emails)
    .where(eq(emails.userId, userId))
    .limit(10000); // Limit to prevent excessive data

  const attachments = await db
    .select()
    .from(emailAttachments)
    .where(eq(emailAttachments.userId, userId))
    .limit(5000);

  const userContacts = await db
    .select()
    .from(contacts)
    .where(eq(contacts.userId, userId));

  const logs = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.actorId, userId))
    .limit(10000);

  const tickets = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.userId, userId));

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId));

  const userSubscriptions = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));

  return {
    exportDate: new Date().toISOString(),
    userId,
    profile: userProfile || null,
    settings: settings || null,
    emailAccounts: accounts,
    emails: userEmails,
    attachments: attachments,
    contacts: userContacts,
    auditLogs: logs,
    supportTickets: tickets,
    orders: userOrders,
    subscriptions: userSubscriptions,
  };
}

/**
 * Create a ZIP file with all exported data
 */
export async function createExportZip(
  data: UserDataExport
): Promise<Uint8Array> {
  const zip = new JSZip();

  // Add metadata file
  zip.file(
    'README.txt',
    `
GDPR Data Export
================

Export Date: ${data.exportDate}
User ID: ${data.userId}

This archive contains all personal data we have stored about you.
All data is provided in JSON format for easy readability and portability.

Files included:
- profile.json: Your user profile information
- settings.json: Your account settings and preferences
- email_accounts.json: Connected email accounts (tokens removed)
- emails.json: Email messages (up to 10,000 most recent)
- attachments.json: Email attachments metadata
- contacts.json: Your contacts and relationship data
- audit_logs.json: Activity logs (up to 10,000 most recent)
- support_tickets.json: Support ticket history
- orders.json: Purchase and order history
- subscriptions.json: Subscription information

For questions about this export, please contact privacy@imbox.ai
  `.trim()
  );

  // Add each data category as a JSON file
  zip.file('profile.json', JSON.stringify(data.profile, null, 2));
  zip.file('settings.json', JSON.stringify(data.settings, null, 2));
  zip.file(
    'email_accounts.json',
    JSON.stringify(sanitizeAccounts(data.emailAccounts), null, 2)
  );
  zip.file('emails.json', JSON.stringify(data.emails, null, 2));
  zip.file('attachments.json', JSON.stringify(data.attachments, null, 2));
  zip.file('contacts.json', JSON.stringify(data.contacts, null, 2));
  zip.file('audit_logs.json', JSON.stringify(data.auditLogs, null, 2));
  zip.file(
    'support_tickets.json',
    JSON.stringify(data.supportTickets, null, 2)
  );
  zip.file('orders.json', JSON.stringify(data.orders, null, 2));
  zip.file('subscriptions.json', JSON.stringify(data.subscriptions, null, 2));

  // Generate ZIP
  const zipData = await zip.generateAsync({ type: 'uint8array' });
  return zipData;
}

/**
 * Sanitize email accounts by removing sensitive tokens
 */
function sanitizeAccounts(accounts: unknown[]): unknown[] {
  return accounts.map((account: any) => ({
    ...account,
    accessToken: '[REDACTED]',
    refreshToken: '[REDACTED]',
    password: '[REDACTED]',
  }));
}

/**
 * Track data export request
 */
export interface DataExportRequest {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  expiresAt?: Date;
}

export async function createExportRequest(
  userId: string
): Promise<DataExportRequest> {
  // In a real implementation, this would be stored in the database
  // and processed asynchronously via a background job

  const request: DataExportRequest = {
    id: crypto.randomUUID(),
    userId,
    status: 'pending',
    requestedAt: new Date(),
  };

  // TODO: Store in database and queue background job
  // For now, return the request object

  return request;
}

export async function getExportRequest(
  requestId: string
): Promise<DataExportRequest | null> {
  // TODO: Fetch from database
  return null;
}
