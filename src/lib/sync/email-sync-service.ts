'use server';

import { db } from '@/lib/db';
import { emailAccounts, emails, emailFolders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { categorizeIncomingEmail } from '@/lib/screener/email-categorizer';
import { TokenManager } from '@/lib/email/token-manager';
import { GmailService } from '@/lib/email/gmail-api';
import { ImapService } from '@/lib/email/imap-service';
import { logEmailReceived } from '@/lib/contacts/timeline-actions';
import { findContactByEmail } from '@/lib/contacts/helpers';
import { extractEmailAddress } from '@/lib/contacts/email-utils';

/**
 * Map folder name to email category
 */
function mapFolderToCategory(
  folderName: string
): 'inbox' | 'newsfeed' | 'receipts' | 'spam' | 'archived' {
  const normalized = folderName.toLowerCase();

  if (normalized.includes('spam') || normalized.includes('junk')) {
    return 'spam';
  }
  if (normalized.includes('inbox')) {
    return 'inbox';
  }
  if (normalized.includes('archive')) {
    return 'archived';
  }

  // Default to inbox for sent, drafts, and other folders
  return 'inbox';
}

/**
 * Main email sync service with real-time progress tracking
 */
export async function syncEmailAccount(
  accountId: string,
  syncType: 'initial' | 'manual' | 'auto' = 'auto'
) {
  try {
    console.log('🔵 Starting sync for account:', accountId);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log('❌ No user found');
      return { success: false, error: 'Unauthorized' };
    }

    console.log('✅ User authenticated:', user.id);

    // Get account details
    const account = await db.query.emailAccounts.findFirst({
      where: (accounts, { and, eq }) =>
        and(eq(accounts.id, accountId), eq(accounts.userId, user.id)),
    });

    if (!account) {
      console.log('❌ Account not found:', accountId);
      return { success: false, error: 'Account not found' };
    }

    console.log('✅ Account found:', account.emailAddress);

    // Detect initial sync automatically by checking if syncCursor is null
    const isInitialSync = !account.syncCursor;
    const effectiveSyncType =
      syncType === 'auto' && isInitialSync ? 'initial' : syncType;
    console.log(
      `🔄 Sync type: ${effectiveSyncType} (initial=${isInitialSync}, requested=${syncType})`
    );

    // Check if account needs reconnection
    if (await TokenManager.needsReconnection(accountId)) {
      console.log('❌ Account needs reconnection');
      return {
        success: false,
        error:
          'Account needs reconnection. Please reconnect your email account.',
      };
    }

    // Get valid access token (will refresh if needed)
    let accessToken: string;
    try {
      const tokenResult = await TokenManager.getValidAccessToken(accountId);
      accessToken = tokenResult.accessToken;
      console.log(
        '✅ Valid access token obtained for provider:',
        account.provider
      );
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Token validation failed',
      };
    }

    // Update status to syncing
    await db
      .update(emailAccounts)
      .set({
        status: 'syncing',
      } as Partial<typeof emailAccounts.$inferInsert>)
      .where(eq(emailAccounts.id, accountId));

    console.log('✅ Status updated to syncing');

    // Start background sync process
    syncInBackground(
      accountId,
      account,
      user.id,
      accessToken,
      effectiveSyncType
    );

    return { success: true, message: 'Sync started' };
  } catch (error) {
    console.error('❌ Error starting sync:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start sync',
    };
  }
}

/**
 * Classify error type for better handling
 */
function classifyError(error: any): {
  type: 'oauth' | 'permission' | 'rate_limit' | 'network' | 'unknown';
  shouldRetry: boolean;
  userActionRequired: boolean;
  message: string;
} {
  const errorMessage = error?.message || String(error);
  const statusCode = error?.statusCode || error?.status;

  // OAuth/Permission errors (user must reconnect)
  if (
    statusCode === 401 ||
    statusCode === 403 ||
    errorMessage.toLowerCase().includes('forbidden') ||
    errorMessage.toLowerCase().includes('unauthorized') ||
    errorMessage.toLowerCase().includes('access denied') ||
    errorMessage.toLowerCase().includes('access is denied') ||
    errorMessage.toLowerCase().includes('erroraccessdenied')
  ) {
    return {
      type: 'permission',
      shouldRetry: false,
      userActionRequired: true,
      message:
        'Permission denied. Please reconnect your email account to grant proper access.',
    };
  }

  // Rate limiting (retry after delay)
  if (
    statusCode === 429 ||
    errorMessage.toLowerCase().includes('rate limit') ||
    errorMessage.toLowerCase().includes('too many requests')
  ) {
    return {
      type: 'rate_limit',
      shouldRetry: true,
      userActionRequired: false,
      message: 'Rate limit reached. Will retry automatically.',
    };
  }

  // Network errors (retry)
  if (
    errorMessage.toLowerCase().includes('network') ||
    errorMessage.toLowerCase().includes('timeout') ||
    errorMessage.toLowerCase().includes('econnrefused') ||
    errorMessage.toLowerCase().includes('enotfound')
  ) {
    return {
      type: 'network',
      shouldRetry: true,
      userActionRequired: false,
      message: 'Network error. Will retry automatically.',
    };
  }

  // Unknown errors (retry once)
  return {
    type: 'unknown',
    shouldRetry: true,
    userActionRequired: false,
    message: errorMessage || 'Sync failed. Please try again.',
  };
}

/**
 * Background sync process with retry logic
 */
export async function syncInBackground(
  accountId: string,
  account: any,
  userId: string,
  accessToken: string,
  syncType: 'initial' | 'manual' | 'auto' = 'auto',
  retryCount: number = 0
) {
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [5000, 15000, 30000]; // 5s, 15s, 30s

  try {
    console.log('🔄 Starting background sync for account:', accountId);
    if (retryCount > 0) {
      console.log(`🔄 Retry attempt ${retryCount} of ${MAX_RETRIES}`);
    }

    // Use Microsoft Graph API for Microsoft accounts
    if (account.provider === 'microsoft') {
      console.log('📧 Using Microsoft Graph API for sync...');
      await syncWithMicrosoftGraph(
        account,
        accountId,
        userId,
        accessToken,
        syncType
      );
    } else if (account.provider === 'gmail') {
      console.log('📧 Using Gmail API for sync...');
      await syncWithGmail(account, accountId, userId, accessToken, syncType);
    } else if (account.provider === 'imap' || account.provider === 'yahoo') {
      console.log('📧 Using IMAP for sync...');
      await syncWithImap(account, accountId, userId, syncType);
    } else {
      console.log('❌ Unsupported provider:', account.provider);
      throw new Error(`Unsupported provider: ${account.provider}`);
    }

    // Update status to active and clear errors
    await db
      .update(emailAccounts)
      .set({
        status: 'active',
        lastSyncAt: new Date(),
        lastSyncError: null,
        errorMessage: null,
      } as Partial<typeof emailAccounts.$inferInsert>)
      .where(eq(emailAccounts.id, accountId));

    console.log('✅ Background sync completed for account:', accountId);
  } catch (error) {
    console.error('❌ Background sync failed:', error);

    const errorClassification = classifyError(error);
    console.error('📊 Error classification:', errorClassification);

    // Handle based on error type
    if (errorClassification.userActionRequired) {
      // Permission/OAuth errors - user must reconnect
      console.error('🔐 User action required - OAuth/Permission issue');
      await db
        .update(emailAccounts)
        .set({
          status: 'error',
          lastSyncError: errorClassification.message,
          errorMessage: errorClassification.message,
        } as Partial<typeof emailAccounts.$inferInsert>)
        .where(eq(emailAccounts.id, accountId));
    } else if (errorClassification.shouldRetry && retryCount < MAX_RETRIES) {
      // Retry for transient errors
      const delay =
        RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
      console.log(`⏳ Retrying in ${delay / 1000} seconds...`);

      await db
        .update(emailAccounts)
        .set({
          status: 'error',
          lastSyncError: `${errorClassification.message} (Retrying...)`,
          errorMessage: `${errorClassification.message} (Retry ${retryCount + 1}/${MAX_RETRIES})`,
        } as Partial<typeof emailAccounts.$inferInsert>)
        .where(eq(emailAccounts.id, accountId));

      // Schedule retry
      setTimeout(() => {
        syncInBackground(
          accountId,
          account,
          userId,
          accessToken,
          syncType,
          retryCount + 1
        );
      }, delay);
    } else {
      // Max retries reached or non-retryable error
      console.error('❌ Max retries reached or non-retryable error');
      await db
        .update(emailAccounts)
        .set({
          status: 'error',
          lastSyncError: errorClassification.message,
          errorMessage: errorClassification.message,
        } as Partial<typeof emailAccounts.$inferInsert>)
        .where(eq(emailAccounts.id, accountId));
    }
  }
}

/**
 * Sync with Microsoft Graph API
 */
async function syncWithMicrosoftGraph(
  account: any,
  accountId: string,
  userId: string,
  accessToken: string,
  syncType: 'initial' | 'manual' | 'auto' = 'auto'
) {
  try {
    console.log('📧 Syncing with Microsoft Graph API...');

    // Step 1: Sync folders and get folder mapping
    console.log('📁 Step 1: Syncing folders...');
    const folderMapping = await syncFoldersWithGraph(
      account,
      accountId,
      userId,
      accessToken
    );

    // Step 2: Sync emails with folder mapping
    console.log('📧 Step 2: Syncing emails...');
    await syncEmailsWithGraph(
      account,
      accountId,
      userId,
      folderMapping,
      accessToken,
      syncType
    );

    console.log('✅ Microsoft Graph sync completed');
  } catch (error) {
    console.error('❌ Microsoft Graph sync failed:', error);
    throw error;
  }
}

/**
 * Sync folders using Microsoft Graph API
 */
async function syncFoldersWithGraph(
  account: any,
  accountId: string,
  userId: string,
  accessToken: string
): Promise<Record<string, string>> {
  try {
    const response = await fetch(
      'https://graph.microsoft.com/v1.0/me/mailFolders',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.statusText}`);
    }

    const data = await response.json();
    const folders = data.value || [];

    console.log(`📁 Found ${folders.length} folders`);

    // Create folder mapping (folderId -> normalized folderName)
    const folderMapping: Record<string, string> = {};

    // Insert or update folders in database
    for (const folder of folders) {
      const normalizedName = normalizeFolderName(folder.displayName);
      folderMapping[folder.id] = normalizedName;

      await db
        .insert(emailFolders)
        .values({
          accountId,
          userId,
          name: normalizedName,
          externalId: folder.id,
          type: mapFolderType(folder.displayName),
        })
        .onConflictDoUpdate({
          target: [emailFolders.externalId],
          set: {
            name: normalizedName,
            type: mapFolderType(folder.displayName),
          },
        });
    }

    console.log(`✅ Synced ${folders.length} folders`);
    return folderMapping;
  } catch (error) {
    console.error('Error syncing folders with Graph:', error);
    // Return empty mapping if folder sync fails
    return {};
  }
}

/**
 * Update sync progress in database
 */
async function updateSyncProgress(
  accountId: string,
  syncedCount: number
): Promise<void> {
  await db
    .update(emailAccounts)
    .set({
      syncProgress: syncedCount,
      syncUpdatedAt: new Date(),
    } as any)
    .where(eq(emailAccounts.id, accountId));
}

/**
 * Sync emails using Microsoft Graph API with Delta Query support
 */
async function syncEmailsWithGraph(
  account: any,
  accountId: string,
  userId: string,
  folderMapping: Record<string, string> = {},
  accessToken: string,
  syncType: 'initial' | 'manual' | 'auto' = 'auto'
) {
  try {
    // Get the last sync cursor (deltaLink or skiptoken) if exists
    const accountRecord = await db.query.emailAccounts.findFirst({
      where: (accounts, { eq }) => eq(accounts.id, accountId),
    });

    const deltaLink = accountRecord?.syncCursor;

    // Use delta query if we have a deltaLink, otherwise do initial sync
    let currentUrl: string | null;
    if (deltaLink && deltaLink.includes('delta')) {
      // Use the stored deltaLink for incremental sync
      currentUrl = deltaLink;
      console.log('📊 Using delta sync for incremental updates');
    } else {
      // Initial sync or fallback to full sync with delta token - increased to 100 emails per batch
      currentUrl =
        'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages/delta?$top=100&$select=id,subject,from,receivedDateTime,isRead,bodyPreview,hasAttachments,parentFolderId';
      console.log('🔄 Performing initial delta sync');
    }

    let totalSynced = 0;
    let finalDeltaLink: string | null = null;

    // Loop through all pages
    while (currentUrl) {
      const response = await fetch(currentUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Microsoft Graph API error: ${response.statusText}`);
      }

      const data = await response.json();
      const messages = data.value || [];

      console.log(
        `📧 Processing batch of ${messages.length} emails (total: ${totalSynced + messages.length})`
      );

      // Insert emails into database
      let syncedCount = 0;
      for (const message of messages) {
        try {
          const emailData = {
            accountId,
            messageId: message.id,
            threadId: message.id, // Microsoft Graph doesn't have separate thread IDs
            subject: message.subject || '(No Subject)',
            snippet: message.bodyPreview || '',
            fromAddress: message.from?.emailAddress || {
              email: 'unknown@email.com',
              name: 'Unknown',
            },
            toAddresses: [], // Will be populated separately if needed
            receivedAt: message.receivedDateTime
              ? new Date(message.receivedDateTime)
              : new Date(),
            isRead: message.isRead || false,
            isStarred: false, // Microsoft Graph doesn't have starred field in basic query
            hasAttachments: message.hasAttachments || false,
            folderName: normalizeFolderName(
              folderMapping[message.parentFolderId] || 'inbox'
            ), // Use normalized folder mapping or default to inbox
          };

          // Insert email first
          const [insertedEmail] = await db
            .insert(emails)
            .values(emailData)
            .returning()
            .onConflictDoNothing(); // Skip duplicates

          // If email was inserted (not duplicate), categorize it
          if (insertedEmail) {
            let emailCategory;
            let screenedBy;

            if (syncType === 'initial' || syncType === 'manual') {
              // Skip AI categorization - use original folder
              emailCategory = mapFolderToCategory(
                emailData.folderName || 'inbox'
              );
              screenedBy = 'manual_sync';
              console.log(
                `📬 ${syncType} sync - Email going to: ${emailCategory}`
              );
            } else {
              // Auto-sync: use AI categorization
              const emailForCategorization = {
                id: insertedEmail.id,
                subject: emailData.subject,
                bodyText: message.bodyPreview || '',
                bodyHtml: '', // Will be fetched separately if needed
                fromAddress: emailData.fromAddress,
                receivedAt: emailData.receivedAt,
              };

              emailCategory = await categorizeIncomingEmail(
                emailForCategorization,
                userId
              );
              screenedBy = 'ai_rule';
              console.log(`🤖 Auto sync - AI categorized to: ${emailCategory}`);
            }

            // Update email with category
            await db
              .update(emails)
              .set({
                emailCategory: emailCategory,
                screenedBy: screenedBy,
                screenedAt: new Date(),
                screeningStatus: 'screened',
              } as any)
              .where(eq(emails.id, insertedEmail.id));
          }

          syncedCount++;
          totalSynced++;

          // Update progress in database every 10 emails
          if (totalSynced % 10 === 0) {
            await updateSyncProgress(accountId, totalSynced);
          }
        } catch (error) {
          console.error('Error syncing individual email:', error);
          // Continue with next email
        }
      }

      // Get next page URL or delta link
      const nextLink = data['@odata.nextLink'];
      const newDeltaLink = data['@odata.deltaLink'];

      // If we have both, prioritize nextLink to continue pagination
      currentUrl = nextLink || null;
      finalDeltaLink = newDeltaLink || finalDeltaLink;

      // Rate limiting: small delay between batches
      if (currentUrl) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Update sync cursor with final deltaLink
    if (finalDeltaLink) {
      await db
        .update(emailAccounts)
        .set({
          syncCursor: finalDeltaLink,
          updatedAt: new Date(),
        } as any)
        .where(eq(emailAccounts.id, accountId));

      console.log('✅ Delta link saved for next incremental sync');
    }

    console.log(`✅ Synced ${totalSynced} emails`);
  } catch (error) {
    console.error('Error syncing emails with Graph:', error);
    throw error;
  }
}

/**
 * Map folder name to standardized type
 */
function mapFolderType(folderName: string): string {
  const name = folderName.toLowerCase();
  if (name.includes('inbox')) return 'inbox';
  if (name.includes('sent')) return 'sent';
  if (name.includes('draft')) return 'drafts';
  if (name.includes('trash') || name.includes('deleted')) return 'trash';
  if (name.includes('spam') || name.includes('junk')) return 'spam';
  if (name.includes('archive')) return 'archive';
  if (name.includes('starred') || name.includes('important')) return 'starred';
  return 'custom';
}

/**
 * Normalize folder name for consistent storage
 */
function normalizeFolderName(folderName: string): string {
  const name = folderName.toLowerCase();
  if (name.includes('inbox')) return 'inbox';
  if (name.includes('sent')) return 'sent';
  if (name.includes('draft')) return 'drafts';
  if (name.includes('trash') || name.includes('deleted')) return 'trash';
  if (name.includes('spam') || name.includes('junk')) return 'spam';
  if (name.includes('archive')) return 'archive';
  if (name.includes('starred') || name.includes('important')) return 'starred';
  return folderName.toLowerCase(); // Keep original name but lowercase
}

/**
 * Get sync status for an account
 */
export async function getSyncStatus(accountId: string) {
  'use server';

  try {
    console.log('📊 [getSyncStatus] Starting for account:', accountId);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log('❌ [getSyncStatus] No user');
      return { success: false, error: 'Unauthorized' };
    }

    console.log('✅ [getSyncStatus] User:', user.id);

    const account = await db.query.emailAccounts.findFirst({
      where: (accounts, { and, eq }) =>
        and(eq(accounts.id, accountId), eq(accounts.userId, user.id)),
    });

    if (!account) {
      console.log('❌ [getSyncStatus] Account not found');
      return { success: false, error: 'Account not found' };
    }

    console.log('✅ [getSyncStatus] Account found:', account.emailAddress);

    // Get email count - use safe query
    let emailCount = 0;
    try {
      const emailResult = await db
        .select()
        .from(emails)
        .where(eq(emails.accountId, accountId));
      emailCount = emailResult.length;
      console.log('✅ [getSyncStatus] Email count:', emailCount);
    } catch (err) {
      console.error('⚠️ [getSyncStatus] Error counting emails:', err);
      // Continue with 0
    }

    // Get folder count - use safe query
    let folderCount = 0;
    try {
      const folderResult = await db
        .select()
        .from(emailFolders)
        .where(eq(emailFolders.accountId, accountId));
      folderCount = folderResult.length;
      console.log('✅ [getSyncStatus] Folder count:', folderCount);
    } catch (err) {
      console.error('⚠️ [getSyncStatus] Error counting folders:', err);
      // Continue with 0
    }

    const result = {
      success: true as const,
      data: {
        status: account.status,
        lastSyncAt: account.lastSyncAt,
        lastSyncError: account.lastSyncError,
        emailCount,
        folderCount,
      },
    };

    console.log('✅ [getSyncStatus] Returning result:', result);
    return result;
  } catch (error) {
    console.error('❌ [getSyncStatus] Error:', error);
    console.error(
      '❌ [getSyncStatus] Stack:',
      error instanceof Error ? error.stack : 'No stack'
    );
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : 'Failed to get sync status',
    };
  }
}

/**
 * Sync with Gmail API
 */
async function syncWithGmail(
  account: any,
  accountId: string,
  userId: string,
  accessToken: string,
  syncType: 'initial' | 'manual' | 'auto' = 'auto'
) {
  try {
    console.log('📧 Syncing with Gmail API...');

    const gmailConfig = {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`,
    };

    const gmail = new GmailService(gmailConfig);

    // Step 1: Sync labels (Gmail's folders)
    console.log('📁 Step 1: Syncing Gmail labels...');
    await syncGmailLabels(gmail, accountId, userId, accessToken);

    // Step 2: Sync messages
    console.log('📧 Step 2: Syncing Gmail messages...');
    await syncGmailMessages(
      gmail,
      account,
      accountId,
      userId,
      accessToken,
      syncType
    );

    console.log('✅ Gmail sync completed');
  } catch (error) {
    console.error('❌ Gmail sync failed:', error);
    throw error;
  }
}

/**
 * Sync Gmail labels (folders)
 */
async function syncGmailLabels(
  gmail: GmailService,
  accountId: string,
  userId: string,
  accessToken: string
) {
  try {
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/labels',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.statusText}`);
    }

    const data = await response.json();
    const labels = data.labels || [];

    console.log(`📁 Found ${labels.length} Gmail labels`);

    // Insert or update labels in database
    for (const label of labels) {
      const normalizedName = normalizeFolderName(label.name);

      await db
        .insert(emailFolders)
        .values({
          accountId,
          userId,
          name: normalizedName,
          externalId: label.id,
          type: mapGmailLabelType(label.name, label.type),
        })
        .onConflictDoUpdate({
          target: [emailFolders.accountId, emailFolders.externalId],
          set: {
            name: normalizedName,
            type: mapGmailLabelType(label.name, label.type),
          },
        });
    }

    console.log(`✅ Synced ${labels.length} Gmail labels`);
  } catch (error) {
    console.error('Error syncing Gmail labels:', error);
  }
}

/**
 * Sync Gmail messages
 */
async function syncGmailMessages(
  gmail: GmailService,
  account: any,
  accountId: string,
  userId: string,
  accessToken: string,
  syncType: 'initial' | 'manual' | 'auto' = 'auto'
) {
  try {
    // Get the last sync cursor (pageToken) if exists
    const accountRecord = await db.query.emailAccounts.findFirst({
      where: (accounts, { eq }) => eq(accounts.id, accountId),
    });

    let pageToken: string | undefined = accountRecord?.syncCursor || undefined;
    let totalSynced = 0;

    // Continue until no more pages
    while (true) {
      // Fetch messages from Gmail API - increased to 100 per batch
      let url =
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=100';
      if (pageToken) {
        url += `&pageToken=${encodeURIComponent(pageToken)}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Gmail API error: ${response.statusText}`);
      }

      const data = await response.json();
      const messages = data.messages || [];

      if (messages.length === 0) break;

      console.log(
        `📧 Processing batch of ${messages.length} Gmail messages (total: ${totalSynced + messages.length})`
      );

      // Fetch full message details for each message
      let syncedCount = 0;
      for (const message of messages) {
        try {
          const detailsResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (!detailsResponse.ok) {
            console.error(
              `Failed to fetch message ${message.id}:`,
              detailsResponse.statusText
            );
            continue;
          }

          const messageDetails = await detailsResponse.json();

          // Parse Gmail message
          const headers = messageDetails.payload?.headers || [];
          const getHeader = (name: string) =>
            headers.find(
              (h: any) => h.name.toLowerCase() === name.toLowerCase()
            )?.value || '';

          const from = getHeader('from');
          const subject = getHeader('subject');
          const receivedDate = new Date(parseInt(messageDetails.internalDate));

          // Extract email address from "Name <email@example.com>" format
          const fromMatch = from.match(/<([^>]+)>/) || [null, from];
          const fromEmail = fromMatch[1] || from;

          // Get snippet as preview
          const bodyPreview = messageDetails.snippet || '';

          // Determine folder name from labels
          const labelIds = messageDetails.labelIds || [];
          const folderName = labelIds.includes('INBOX')
            ? 'inbox'
            : labelIds.includes('SENT')
              ? 'sent'
              : labelIds.includes('DRAFT')
                ? 'drafts'
                : labelIds.includes('TRASH')
                  ? 'trash'
                  : labelIds.includes('SPAM')
                    ? 'spam'
                    : 'inbox';

          // Categorize email
          let emailCategory;
          let screenedBy;

          if (syncType === 'initial' || syncType === 'manual') {
            // Skip AI categorization - use original folder
            emailCategory = mapFolderToCategory(folderName);
            screenedBy = 'manual_sync';
            console.log(
              `📬 ${syncType} sync - Email going to: ${emailCategory}`
            );
          } else {
            // Auto-sync: use AI categorization
            emailCategory = await categorizeIncomingEmail(
              {
                subject,
                fromAddress: { email: fromEmail, name: from },
                bodyPreview,
              } as any,
              userId
            );
            screenedBy = 'ai_rule';
            console.log(`🤖 Auto sync - AI categorized to: ${emailCategory}`);
          }

          const emailData = {
            accountId,
            messageId: messageDetails.id,
            threadId: messageDetails.threadId,
            subject,
            fromAddress: { email: fromEmail, name: from },
            toAddresses: [], // TODO: Parse To field
            receivedAt: receivedDate,
            isRead: !labelIds.includes('UNREAD'),
            bodyPreview,
            hasAttachments:
              messageDetails.payload?.parts?.some(
                (p: any) => p.filename && p.filename.length > 0
              ) || false,
            folderName,
            labelIds,
            emailCategory, // Set category
            screenedBy,
            screenedAt: new Date(),
            screeningStatus: 'screened' as const,
          };

          // Insert or update email
          await db
            .insert(emails)
            .values(emailData as any)
            .onConflictDoUpdate({
              target: [emails.accountId, emails.messageId],
              set: {
                isRead: emailData.isRead,
                folderName: emailData.folderName,
                labelIds: emailData.labelIds,
                emailCategory: emailData.emailCategory as any,
                screenedAt: emailData.screenedAt,
                screenedBy: emailData.screenedBy,
              },
            });

          // Auto-log to contact timeline (don't block on errors)
          try {
            const senderEmail = extractEmailAddress(emailData.fromAddress);
            if (senderEmail) {
              const contactId = await findContactByEmail(senderEmail);
              if (contactId) {
                await logEmailReceived(
                  contactId,
                  emailData.subject,
                  messageDetails.id
                );
              }
            }
          } catch (logError) {
            // Don't block sync on logging errors
            console.error(`Failed to log email to contact timeline:`, logError);
          }

          syncedCount++;
          totalSynced++;

          // Update progress in database every 10 emails
          if (totalSynced % 10 === 0) {
            await updateSyncProgress(accountId, totalSynced);
          }
        } catch (emailError) {
          console.error(
            `Error syncing Gmail message ${message.id}:`,
            emailError
          );
        }
      }

      // Check for next page
      pageToken = data.nextPageToken;
      if (!pageToken) break;

      // Rate limiting: small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`✅ Synced ${totalSynced} Gmail messages`);

    // Clear sync cursor since we're done with pagination
    await db
      .update(emailAccounts)
      .set({
        syncCursor: null,
        updatedAt: new Date(),
      } as any)
      .where(eq(emailAccounts.id, accountId));
  } catch (error) {
    console.error('Error syncing Gmail messages:', error);
    throw error;
  }
}

/**
 * Map Gmail label type to our folder type
 */
function mapGmailLabelType(
  labelName: string,
  labelType: string
): 'inbox' | 'sent' | 'drafts' | 'trash' | 'archive' | 'custom' {
  const normalized = labelName.toLowerCase();

  if (normalized === 'inbox') return 'inbox';
  if (normalized === 'sent' || normalized.includes('sent')) return 'sent';
  if (normalized === 'drafts' || normalized.includes('draft')) return 'drafts';
  if (normalized === 'trash' || normalized.includes('trash')) return 'trash';
  if (
    normalized === 'archive' ||
    normalized === 'all mail' ||
    normalized.includes('archive')
  )
    return 'archive';

  return 'custom';
}

/**
 * Sync with IMAP
 */
async function syncWithImap(
  account: any,
  accountId: string,
  userId: string,
  syncType: 'initial' | 'manual' | 'auto' = 'auto'
) {
  try {
    console.log('📧 Syncing with IMAP...');

    if (
      !account.imapHost ||
      !account.imapUsername ||
      !account.imapPassword ||
      !account.imapPort
    ) {
      throw new Error(
        'IMAP configuration incomplete. Missing host, username, password, or port.'
      );
    }

    const imapConfig = {
      user: account.imapUsername,
      password: account.imapPassword, // TODO: Decrypt if encrypted
      host: account.imapHost,
      port: account.imapPort,
      tls: account.imapUseSsl !== false,
    };

    const imap = new ImapService(imapConfig);

    // Step 1: Sync mailboxes (folders)
    console.log('📁 Step 1: Syncing IMAP mailboxes...');
    const mailboxes = await imap.getMailboxes();

    for (const mailbox of mailboxes) {
      await db
        .insert(emailFolders)
        .values({
          accountId,
          userId,
          name: normalizeFolderName(mailbox.name),
          externalId: mailbox.path,
          type: mapImapFolderType(mailbox.name),
        })
        .onConflictDoUpdate({
          target: [emailFolders.accountId, emailFolders.externalId],
          set: {
            name: normalizeFolderName(mailbox.name),
            type: mapImapFolderType(mailbox.name),
          },
        });
    }

    console.log(`✅ Synced ${mailboxes.length} IMAP mailboxes`);

    // Step 2: Sync messages from INBOX
    console.log('📧 Step 2: Syncing IMAP messages from INBOX...');
    const messages = await imap.fetchMessages('INBOX', 50);

    let syncedCount = 0;
    for (const message of messages) {
      try {
        // Categorize email
        let emailCategory;
        let screenedBy;

        if (syncType === 'initial' || syncType === 'manual') {
          // Skip AI categorization - use original folder (INBOX for IMAP)
          emailCategory = mapFolderToCategory('inbox');
          screenedBy = 'manual_sync';
          console.log(`📬 ${syncType} sync - Email going to: ${emailCategory}`);
        } else {
          // Auto-sync: use AI categorization
          emailCategory = await categorizeIncomingEmail(
            {
              subject: message.subject,
              fromAddress: message.from,
              bodyPreview: message.bodyPreview,
            } as any,
            userId
          );
          screenedBy = 'ai_rule';
          console.log(`🤖 Auto sync - AI categorized to: ${emailCategory}`);
        }

        const emailData = {
          accountId,
          messageId: message.id,
          subject: message.subject,
          fromAddress: message.from,
          toAddresses: message.to,
          receivedAt: message.receivedAt,
          isRead: message.isRead,
          bodyPreview: message.bodyPreview,
          emailCategory,
          screenedBy,
          screenedAt: new Date(),
          screeningStatus: 'screened' as const,
          bodyHtml: message.bodyHtml,
          bodyText: message.bodyText,
          hasAttachments: message.hasAttachments,
          folderName: message.folderName,
        };

        // Insert or update email
        await db
          .insert(emails)
          .values(emailData as any)
          .onConflictDoUpdate({
            target: [emails.accountId, emails.messageId],
            set: {
              isRead: emailData.isRead,
              folderName: emailData.folderName,
              emailCategory: emailData.emailCategory as any,
              screenedAt: emailData.screenedAt,
              screenedBy: emailData.screenedBy,
            },
          });

        // Auto-log to contact timeline (don't block on errors)
        try {
          const senderEmail = extractEmailAddress(emailData.fromAddress);
          if (senderEmail) {
            const contactId = await findContactByEmail(senderEmail);
            if (contactId) {
              await logEmailReceived(contactId, emailData.subject, message.id);
            }
          }
        } catch (logError) {
          // Don't block sync on logging errors
          console.error(
            `Failed to log IMAP email to contact timeline:`,
            logError
          );
        }

        syncedCount++;
      } catch (emailError) {
        console.error(`Error syncing IMAP message ${message.id}:`, emailError);
      }
    }

    console.log(`✅ Synced ${syncedCount} IMAP messages`);
    console.log('✅ IMAP sync completed');
  } catch (error) {
    console.error('❌ IMAP sync failed:', error);
    throw error;
  }
}

/**
 * Map IMAP folder name to our folder type
 */
function mapImapFolderType(
  folderName: string
): 'inbox' | 'sent' | 'drafts' | 'trash' | 'archive' | 'custom' {
  const normalized = folderName.toLowerCase();

  if (normalized === 'inbox') return 'inbox';
  if (normalized.includes('sent')) return 'sent';
  if (normalized.includes('draft')) return 'drafts';
  if (normalized.includes('trash') || normalized.includes('deleted'))
    return 'trash';
  if (normalized.includes('archive') || normalized.includes('all mail'))
    return 'archive';

  return 'custom';
}

/**
 * Cancel ongoing sync
 */
export async function cancelSync(accountId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    await db
      .update(emailAccounts)
      .set({
        status: 'active',
      } as any)
      .where(eq(emailAccounts.id, accountId));

    return { success: true, message: 'Sync cancelled' };
  } catch (error) {
    console.error('Error cancelling sync:', error);
    return { success: false, error: 'Failed to cancel sync' };
  }
}
