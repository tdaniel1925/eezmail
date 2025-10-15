'use server';

import { db } from '@/lib/db';
import { emailAccounts, emails, emailFolders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { categorizeIncomingEmail } from '@/lib/screener/email-categorizer';
import { TokenManager } from '@/lib/email/token-manager';
import { GmailService } from '@/lib/email/gmail-api';
import { ImapService } from '@/lib/email/imap-service';

/**
 * Main email sync service with real-time progress tracking
 */
export async function syncEmailAccount(accountId: string) {
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
    syncInBackground(accountId, account, user.id, accessToken);

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
      await syncWithMicrosoftGraph(account, accountId, userId, accessToken);
    } else if (account.provider === 'gmail') {
      console.log('📧 Using Gmail API for sync...');
      await syncWithGmail(account, accountId, userId, accessToken);
    } else if (account.provider === 'imap' || account.provider === 'yahoo') {
      console.log('📧 Using IMAP for sync...');
      await syncWithImap(account, accountId, userId);
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
  accessToken: string
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
      accessToken
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
 * Sync emails using Microsoft Graph API with Delta Query support
 */
async function syncEmailsWithGraph(
  account: any,
  accountId: string,
  userId: string,
  folderMapping: Record<string, string> = {},
  accessToken: string
) {
  try {
    // Get the last sync cursor (deltaLink or skiptoken) if exists
    const accountRecord = await db.query.emailAccounts.findFirst({
      where: (accounts, { eq }) => eq(accounts.id, accountId),
    });

    const deltaLink = accountRecord?.syncCursor;

    // Use delta query if we have a deltaLink, otherwise do initial sync
    let url: string;
    if (deltaLink && deltaLink.includes('delta')) {
      // Use the stored deltaLink for incremental sync
      url = deltaLink;
      console.log('📊 Using delta sync for incremental updates');
    } else {
      // Initial sync or fallback to full sync with delta token
      url =
        'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages/delta?$top=50&$select=id,subject,from,receivedDateTime,isRead,bodyPreview,hasAttachments,parentFolderId';
      console.log('🔄 Performing initial delta sync');
    }

    const response = await fetch(url, {
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

    // Get the next link for pagination or delta link for next sync
    const nextLink = data['@odata.nextLink'];
    const newDeltaLink = data['@odata.deltaLink'];

    console.log(`📧 Found ${messages.length} emails to sync`);

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
          const emailForCategorization = {
            id: insertedEmail.id,
            subject: emailData.subject,
            bodyText: message.bodyPreview || '',
            bodyHtml: '', // Will be fetched separately if needed
            fromAddress: emailData.fromAddress,
            receivedAt: emailData.receivedAt,
          };

          const category = await categorizeIncomingEmail(
            emailForCategorization,
            userId
          );

          // Update email with category
          await db
            .update(emails)
            .set({
              emailCategory: category,
              screenedBy: 'ai_rule',
              screenedAt: new Date(),
            } as any)
            .where(eq(emails.id, insertedEmail.id));
        }

        syncedCount++;
      } catch (error) {
        console.error('Error syncing individual email:', error);
        // Continue with next email
      }
    }

    // Update sync cursor with deltaLink or nextLink
    // deltaLink is used for next incremental sync, nextLink is for pagination
    const cursorToSave = newDeltaLink || nextLink || null;
    if (cursorToSave) {
      await db
        .update(emailAccounts)
        .set({
          syncCursor: cursorToSave,
          updatedAt: new Date(),
        } as any)
        .where(eq(emailAccounts.id, accountId));

      if (newDeltaLink) {
        console.log('✅ Delta link saved for next incremental sync');
      } else if (nextLink) {
        console.log('🔄 Next page link saved for pagination');
      }
    }

    console.log(`✅ Synced ${syncedCount} emails`);
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
  accessToken: string
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
    await syncGmailMessages(gmail, account, accountId, userId, accessToken);

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
  accessToken: string
) {
  try {
    // Get the last sync cursor (pageToken) if exists
    const accountRecord = await db.query.emailAccounts.findFirst({
      where: (accounts, { eq }) => eq(accounts.id, accountId),
    });

    let pageToken = accountRecord?.syncCursor || undefined;

    // Fetch messages from Gmail API
    let url =
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50';
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
    const nextPageToken = data.nextPageToken;

    console.log(`📧 Found ${messages.length} Gmail messages to sync`);

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
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())
            ?.value || '';

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

        // Categorize email using AI
        const emailCategory = await categorizeIncomingEmail(
          {
            subject,
            fromAddress: { email: fromEmail, name: from },
            bodyPreview,
          } as any,
          userId
        );

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
          emailCategory, // Set category from AI
          screenedAt: emailCategory !== 'unscreened' ? new Date() : null,
          screenedBy: emailCategory !== 'unscreened' ? 'ai_rule' : null,
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

        syncedCount++;
      } catch (emailError) {
        console.error(`Error syncing Gmail message ${message.id}:`, emailError);
      }
    }

    console.log(`✅ Synced ${syncedCount} Gmail messages`);

    // Update sync cursor with nextPageToken
    if (nextPageToken) {
      await db
        .update(emailAccounts)
        .set({
          syncCursor: nextPageToken,
          updatedAt: new Date(),
        } as any)
        .where(eq(emailAccounts.id, accountId));
    }
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
async function syncWithImap(account: any, accountId: string, userId: string) {
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
        // Categorize email using AI
        const emailCategory = await categorizeIncomingEmail(
          {
            subject: message.subject,
            fromAddress: message.from,
            bodyPreview: message.bodyPreview,
          } as any,
          userId
        );

        const emailData = {
          accountId,
          messageId: message.id,
          subject: message.subject,
          fromAddress: message.from,
          toAddresses: message.to,
          receivedAt: message.receivedAt,
          isRead: message.isRead,
          bodyPreview: message.bodyPreview,
          bodyHtml: message.bodyHtml,
          bodyText: message.bodyText,
          hasAttachments: message.hasAttachments,
          folderName: message.folderName,
          emailCategory,
          screenedAt: emailCategory !== 'unscreened' ? new Date() : null,
          screenedBy: emailCategory !== 'unscreened' ? 'ai_rule' : null,
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
