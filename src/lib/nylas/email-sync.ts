/**
 * Nylas Email Sync Implementation
 * Real email synchronization with incremental sync support
 */

'use server';

import { nylasClient } from './server';
import { db } from '@/lib/db';
import { emails, emailAccounts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import type { EmailAddress } from '@/db/schema';

export interface SyncOptions {
  mode: 'full' | 'incremental';
  limit?: number;
  folders?: string[];
  since?: Date;
  batchSize?: number;
}

export interface SyncResult {
  success: boolean;
  emailsSynced: number;
  emailsCreated: number;
  emailsUpdated: number;
  nextCursor?: string;
  error?: string;
}

export interface SyncProgress {
  phase: 'connecting' | 'fetching' | 'processing' | 'complete' | 'error';
  current: number;
  total: number;
  cursor?: string;
}

/**
 * Main sync function - fetches emails from Nylas and stores in database
 */
export async function syncEmailsFromNylas(
  accountId: string,
  options: SyncOptions = { mode: 'incremental' }
): Promise<SyncResult> {
  try {
    // Get account details
    const [account] = await db
      .select()
      .from(emailAccounts)
      .where(eq(emailAccounts.id, accountId))
      .limit(1);

    if (!account) {
      throw new Error('Email account not found');
    }

    if (!account.nylasGrantId) {
      throw new Error('No Nylas grant ID found for account');
    }

    // Update sync status to 'syncing'
    await db
      .update(emailAccounts)
      .set({
        syncStatus: 'syncing',
        syncProgress: 0,
        syncTotal: 0,
        updatedAt: new Date(),
      })
      .where(eq(emailAccounts.id, accountId));

    // Build query parameters
    const queryParams: any = {
      limit: options.batchSize || 50,
    };

    // Incremental sync - use cursor or timestamp
    if (options.mode === 'incremental' && account.syncCursor) {
      queryParams.pageToken = account.syncCursor;
    } else if (options.mode === 'incremental' && account.lastSuccessfulSyncAt) {
      // Use timestamp-based sync as fallback
      const sinceTimestamp = Math.floor(
        account.lastSuccessfulSyncAt.getTime() / 1000
      );
      queryParams.receivedAfter = sinceTimestamp;
    }

    // Add folder filter if specified
    if (options.folders && options.folders.length > 0) {
      queryParams.in = options.folders;
    }

    let totalSynced = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    let nextCursor: string | undefined;
    let hasMore = true;

    // Fetch messages in batches
    while (hasMore) {
      try {
        const response = await nylasClient.messages.list({
          identifier: account.nylasGrantId,
          queryParams: {
            ...queryParams,
            limit: options.limit || 50,
          },
        });

        const messages = response.data;
        nextCursor = response.nextCursor;

        if (!messages || messages.length === 0) {
          hasMore = false;
          break;
        }

        // Process each message
        for (const message of messages) {
          try {
            const result = await upsertEmail(accountId, message);
            totalSynced++;
            if (result === 'created') totalCreated++;
            if (result === 'updated') totalUpdated++;
          } catch (error) {
            console.error(`Error processing message ${message.id}:`, error);
            // Continue with next message
          }
        }

        // Update progress
        await db
          .update(emailAccounts)
          .set({
            syncProgress: totalSynced,
            syncCursor: nextCursor,
            updatedAt: new Date(),
          })
          .where(eq(emailAccounts.id, accountId));

        // Check if there are more pages
        if (!nextCursor || messages.length < (options.limit || 50)) {
          hasMore = false;
        }

        // Use next cursor for next batch
        if (nextCursor) {
          queryParams.pageToken = nextCursor;
        }
      } catch (batchError) {
        console.error('Error fetching batch:', batchError);
        hasMore = false;
        throw batchError;
      }
    }

    // Update sync status to 'success'
    await db
      .update(emailAccounts)
      .set({
        syncStatus: 'success',
        lastSyncAt: new Date(),
        lastSuccessfulSyncAt: new Date(),
        syncCursor: nextCursor,
        syncProgress: totalSynced,
        syncTotal: totalSynced,
        errorCount: 0,
        consecutiveErrors: 0,
        lastSyncError: null,
        updatedAt: new Date(),
      })
      .where(eq(emailAccounts.id, accountId));

    return {
      success: true,
      emailsSynced: totalSynced,
      emailsCreated: totalCreated,
      emailsUpdated: totalUpdated,
      nextCursor,
    };
  } catch (error) {
    console.error('Email sync error:', error);

    // Update sync status to 'error'
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown sync error';

    await db
      .update(emailAccounts)
      .set({
        syncStatus: 'error',
        lastSyncError: errorMessage,
        errorCount: db.$default,
        consecutiveErrors: db.$default,
        updatedAt: new Date(),
      })
      .where(eq(emailAccounts.id, accountId));

    return {
      success: false,
      emailsSynced: 0,
      emailsCreated: 0,
      emailsUpdated: 0,
      error: errorMessage,
    };
  }
}

/**
 * Upsert email - create or update if exists
 */
async function upsertEmail(
  accountId: string,
  message: any
): Promise<'created' | 'updated'> {
  // Check if email already exists by message ID or Nylas message ID
  const [existing] = await db
    .select()
    .from(emails)
    .where(
      and(
        eq(emails.accountId, accountId),
        eq(emails.nylasMessageId, message.id)
      )
    )
    .limit(1);

  // Map Nylas message to our schema
  const emailData = mapNylasMessageToEmail(accountId, message);

  if (existing) {
    // Update existing email
    await db
      .update(emails)
      .set({
        ...emailData,
        updatedAt: new Date(),
      })
      .where(eq(emails.id, existing.id));

    return 'updated';
  } else {
    // Insert new email
    await db.insert(emails).values(emailData);
    return 'created';
  }
}

/**
 * Map Nylas message format to our database schema
 */
function mapNylasMessageToEmail(accountId: string, message: any) {
  // Parse from address
  const fromAddress: EmailAddress = message.from?.[0]
    ? {
        email: message.from[0].email || '',
        name: message.from[0].name,
      }
    : { email: '', name: '' };

  // Parse to addresses
  const toAddresses: EmailAddress[] =
    message.to?.map((addr: any) => ({
      email: addr.email || '',
      name: addr.name,
    })) || [];

  // Parse cc addresses
  const ccAddresses: EmailAddress[] =
    message.cc?.map((addr: any) => ({
      email: addr.email || '',
      name: addr.name,
    })) || [];

  // Parse bcc addresses
  const bccAddresses: EmailAddress[] =
    message.bcc?.map((addr: any) => ({
      email: addr.email || '',
      name: addr.name,
    })) || [];

  // Parse reply-to
  const replyTo: EmailAddress[] =
    message.replyTo?.map((addr: any) => ({
      email: addr.email || '',
      name: addr.name,
    })) || [];

  // Determine folder name from labels/folders
  let folderName = 'inbox';
  if (message.folders && message.folders.length > 0) {
    folderName = message.folders[0].name || message.folders[0].id || 'inbox';
  } else if (message.labels && message.labels.length > 0) {
    folderName = message.labels[0].name || message.labels[0].id || 'inbox';
  }

  return {
    accountId,
    messageId: message.messageId || message.id, // RFC 2822 Message-ID
    nylasMessageId: message.id,
    providerMessageId: message.providerId,
    threadId: message.threadId,
    subject: message.subject || '(no subject)',
    snippet: message.snippet || '',
    fromAddress,
    toAddresses,
    ccAddresses: ccAddresses.length > 0 ? ccAddresses : null,
    bccAddresses: bccAddresses.length > 0 ? bccAddresses : null,
    replyTo: replyTo.length > 0 ? replyTo : null,
    bodyText: message.body || '',
    bodyHtml: message.bodyHtml || null,
    receivedAt: message.date ? new Date(message.date * 1000) : new Date(),
    sentAt: message.date ? new Date(message.date * 1000) : null,
    isRead: message.unread === false,
    isStarred: message.starred === true,
    isImportant: message.important === true,
    isDraft: message.isDraft === true,
    hasDrafts: false,
    hasAttachments: (message.attachments?.length || 0) > 0,
    folderName,
    labelIds: message.labels?.map((l: any) => l.id) || [],
    screeningStatus: 'pending',
    aiSummary: null,
    customFolderId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Get sync progress for an account
 */
export async function getSyncProgress(
  accountId: string
): Promise<SyncProgress | null> {
  const [account] = await db
    .select({
      syncStatus: emailAccounts.syncStatus,
      syncProgress: emailAccounts.syncProgress,
      syncTotal: emailAccounts.syncTotal,
      syncCursor: emailAccounts.syncCursor,
    })
    .from(emailAccounts)
    .where(eq(emailAccounts.id, accountId))
    .limit(1);

  if (!account) return null;

  let phase: SyncProgress['phase'] = 'complete';
  if (account.syncStatus === 'syncing') phase = 'fetching';
  else if (account.syncStatus === 'error') phase = 'error';
  else if (account.syncStatus === 'idle') phase = 'complete';

  return {
    phase,
    current: account.syncProgress || 0,
    total: account.syncTotal || 0,
    cursor: account.syncCursor || undefined,
  };
}
