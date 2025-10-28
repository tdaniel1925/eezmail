import { inngest } from '../client';
import { db } from '@/lib/db';
import { emailAccounts, emailFolders, emails } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import {
  detectFolderType,
  isSystemFolder,
  getDefaultDisplayName,
  getDefaultIcon,
  getDefaultSortOrder,
  getDefaultSyncFrequency,
  getDefaultSyncDaysBack,
  shouldSyncByDefault,
} from '@/lib/folders/folder-mapper';

/**
 * Helper function to categorize emails based on folder name
 * Maps folder names to VALID email_category enum values ONLY
 *
 * Valid values: 'inbox', 'sent', 'drafts', 'junk', 'outbox', 'deleted'
 */
function categorizeFolderName(folderName: string): string {
  const normalized = folderName.toLowerCase();

  // Primary categories (exact match to enum)
  if (normalized === 'inbox') return 'inbox';

  // Spam/Junk → junk (enum uses 'junk', not 'spam')
  if (
    normalized === 'spam' ||
    normalized === 'junk' ||
    normalized === 'junkemail'
  )
    return 'junk';

  // Archive → deleted (closest match in enum)
  if (normalized === 'archive' || normalized === 'archived') return 'deleted';

  // Sent items → sent category
  if (normalized === 'sent' || normalized === 'sentitems') return 'sent';

  // Drafts → drafts
  if (normalized === 'drafts') return 'drafts';

  // Trash/Deleted → deleted
  if (
    normalized === 'trash' ||
    normalized === 'deleteditems' ||
    normalized === 'deleted'
  )
    return 'deleted';

  // Outbox → outbox
  if (normalized === 'outbox') return 'outbox';

  // Custom folders → inbox (safest default in the enum)
  return 'inbox';
}

/**
 * MICROSOFT EMAIL SYNC - INNGEST FUNCTION
 * Durable, reliable email synchronization for Microsoft accounts
 *
 * Features:
 * - Automatic retries on failure
 * - Step-by-step checkpoints
 * - Progress tracking
 * - Delta sync support
 * - Visual debugging in Inngest UI
 */

export const syncMicrosoftAccount = inngest.createFunction(
  {
    id: 'sync-microsoft-account',
    retries: 3,
    concurrency: {
      limit: 5, // Max 5 accounts syncing simultaneously
      key: 'event.data.accountId', // One sync per account at a time
    },
  },
  { event: 'email/microsoft.sync' },
  async ({ event, step }) => {
    const { accountId, userId, syncMode, trigger } = event.data;

    console.log(`🚀 Microsoft sync started`);
    console.log(`   Account ID: ${accountId}`);
    console.log(`   Sync Mode: ${syncMode}`);
    console.log(`   Trigger: ${trigger}`);

    try {
      // STEP 1: Validate Account Exists (early exit if deleted)
      const accountExists = await step.run('check-account-exists', async () => {
        const acc = await db
          .select()
          .from(emailAccounts)
          .where(eq(emailAccounts.id, accountId))
          .limit(1);

        if (!acc || acc.length === 0) {
          console.error(
            `❌ Account ${accountId} not found - may have been deleted`
          );
          return null;
        }
        return acc[0];
      });

      if (!accountExists) {
        return {
          success: false,
          error: 'Account not found - may have been deleted',
          shouldRetry: false,
        };
      }

      // STEP 2: Validate Account Details
      const account = await step.run('validate-account', async () => {
        const acc = await db.query.emailAccounts.findFirst({
          where: and(
            eq(emailAccounts.id, accountId),
            eq(emailAccounts.userId, userId)
          ),
        });

        if (!acc) throw new Error('Account not found');
        if (acc.provider !== 'microsoft') throw new Error('Invalid provider');
        if (!acc.accessToken) throw new Error('No access token');

        console.log(`✅ Validated account: ${acc.emailAddress}`);
        return acc;
      });

      // STEP 3: Get Valid Access Token
      const accessToken = await step.run('refresh-token', async () => {
        // Check if token is expired or expiring soon (within 5 minutes)
        const now = new Date();
        const expiresAt = account.tokenExpiresAt;
        const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

        console.log(`🔍 Token check: expires at ${expiresAt}, now is ${now}`);

        if (!expiresAt || new Date(expiresAt) <= fiveMinutesFromNow) {
          console.log('🔄 Token expired or expiring soon, refreshing...');

          if (!account.refreshToken) {
            throw new Error(
              'No refresh token available. Please reconnect your account.'
            );
          }

          // Refresh token
          const response = await fetch(
            'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                client_id: process.env.MICROSOFT_CLIENT_ID!,
                client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
                refresh_token: account.refreshToken,
                grant_type: 'refresh_token',
                scope:
                  'https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/User.Read offline_access',
              }),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error(
              '❌ Token refresh failed:',
              response.status,
              errorText
            );

            // Update account status to error
            await db
              .update(emailAccounts)
              .set({
                status: 'error',
                syncStatus: 'idle',
                lastSyncError: `Authentication failed (${response.status}). The access token may be invalid. Please try removing and re-adding your Microsoft account.`,
              } as any)
              .where(eq(emailAccounts.id, accountId));

            throw new Error(
              `Authentication failed (${response.status}). The access token may be invalid. Please try removing and re-adding your Microsoft account.`
            );
          }

          const tokens = await response.json();

          if (!tokens.access_token) {
            throw new Error('No access token received from refresh');
          }

          // Update tokens in database
          await db
            .update(emailAccounts)
            .set({
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token || account.refreshToken,
              tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
            } as any)
            .where(eq(emailAccounts.id, accountId));

          console.log('✅ Token refreshed successfully');
          console.log(
            `   New token expires: ${new Date(Date.now() + tokens.expires_in * 1000)}`
          );
          return tokens.access_token;
        }

        console.log('✅ Token still valid');
        return account.accessToken;
      });

      // STEP 3: Sync Folders
      const folders = await step.run('sync-folders', async () => {
        console.log('📁 Fetching folders from Microsoft Graph...');
        console.log(`   Using token: ${accessToken.substring(0, 20)}...`);

        // Fetch ALL folders including special ones (Sent, Drafts, etc.)
        const response = await fetch(
          'https://graph.microsoft.com/v1.0/me/mailFolders?$top=100&includeHiddenFolders=false',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Failed to fetch folders:', response.status);
          console.error('   Error details:', errorText);

          if (response.status === 401) {
            throw new Error(
              'Authentication failed (401). The access token may be invalid. Please try removing and re-adding your Microsoft account.'
            );
          }

          throw new Error(
            `Failed to fetch folders: ${response.status} - ${errorText}`
          );
        }

        const data = await response.json();
        const folderList = data.value || [];

        console.log(`📊 Found ${folderList.length} folders`);

        // Upsert folders into database
        for (const folder of folderList) {
          const normalizedName = normalizeFolderName(folder.displayName);

          // NEW: Detect folder type using the mapping utility
          const folderType = detectFolderType(folder.displayName, 'microsoft');
          const isSystem = isSystemFolder(folderType);

          await db
            .insert(emailFolders)
            .values({
              accountId,
              userId,
              externalId: folder.id,
              name: normalizedName,
              type: normalizedName, // ✅ Keep old field for backwards compatibility

              // NEW: Standardized fields
              folderType, // ✅ New standardized type
              isSystemFolder: isSystem,
              displayName: folder.displayName, // Original name from provider
              icon: getDefaultIcon(folderType),
              sortOrder: getDefaultSortOrder(folderType),
              syncEnabled: shouldSyncByDefault(folderType),
              syncFrequencyMinutes: getDefaultSyncFrequency(folderType),
              syncDaysBack: getDefaultSyncDaysBack(folderType),

              messageCount: folder.totalItemCount || 0,
              unreadCount: folder.unreadItemCount || 0,
              syncStatus: 'idle',
            } as any)
            .onConflictDoUpdate({
              target: [emailFolders.accountId, emailFolders.externalId],
              set: {
                // Update message counts
                messageCount: folder.totalItemCount || 0,
                unreadCount: folder.unreadItemCount || 0,

                // Update folder type if changed (rare, but possible)
                folderType,
                displayName: folder.displayName,

                updatedAt: new Date(),
              } as any,
            });
        }

        console.log(`✅ Synced ${folderList.length} folders`);
        return folderList;
      });

      // STEP 4: Sync Emails from Each Folder
      let totalEmailsSynced = 0;

      for (let i = 0; i < folders.length; i++) {
        const folder = folders[i];
        const folderName = normalizeFolderName(folder.displayName);

        // Update progress before syncing folder
        const progressPercent = Math.floor((i / folders.length) * 90); // 0-90% for folder sync
        await db
          .update(emailAccounts)
          .set({
            syncProgress: progressPercent,
            syncStatus: 'syncing',
          } as any)
          .where(eq(emailAccounts.id, accountId));

        const folderResult = await step.run(
          `sync-folder-${folder.id}`,
          async () => {
            return await syncFolderEmails({
              accountId,
              userId,
              accessToken,
              folder,
              folderName,
              syncMode,
              account,
            });
          }
        );

        totalEmailsSynced += folderResult.emailsSynced;

        console.log(
          `📁 Folder "${folderName}": ${folderResult.emailsSynced} emails synced (${i + 1}/${folders.length})`
        );
      }

      // Update progress to 95% before final steps
      await db
        .update(emailAccounts)
        .set({
          syncProgress: 95,
        } as any)
        .where(eq(emailAccounts.id, accountId));

      // STEP 5: Recalculate Folder Counts (DO THIS FIRST!)
      await step.run('recalculate-counts', async () => {
        console.log('📊 Recalculating folder counts...');

        const dbFolders = await db.query.emailFolders.findMany({
          where: eq(emailFolders.accountId, accountId),
        });

        for (const folder of dbFolders) {
          // Use raw SQL to avoid Drizzle query builder syntax issues
          // Match emails.folder_name with emailFolders.name
          const totalResult = await db.execute(
            sql`
            SELECT COUNT(*)::int as count 
            FROM emails 
            WHERE account_id = ${accountId}::uuid 
              AND folder_name = ${folder.name}
          `
          );

          const unreadResult = await db.execute(
            sql`
            SELECT COUNT(*)::int as count 
            FROM emails 
            WHERE account_id = ${accountId}::uuid 
              AND folder_name = ${folder.name}
              AND is_read = false
          `
          );

          // db.execute() returns an array directly, not { rows: [] }
          const totalCount = (totalResult[0] as any)?.count || 0;
          const unreadCount = (unreadResult[0] as any)?.count || 0;

          await db
            .update(emailFolders)
            .set({
              messageCount: totalCount,
              unreadCount: unreadCount,
              updatedAt: new Date(),
            } as any)
            .where(eq(emailFolders.id, folder.id));
        }

        console.log(`✅ Recalculated counts for ${dbFolders.length} folders`);
      });

      // STEP 6: Mark Sync Complete (DO THIS LAST!)
      await step.run('mark-complete', async () => {
        await db
          .update(emailAccounts)
          .set({
            status: 'active',
            syncStatus: 'idle',
            initialSyncCompleted: true,
            lastSyncAt: new Date(),
            lastSuccessfulSyncAt: new Date(),
            lastSyncError: null,
            syncProgress: 100,
          } as any)
          .where(eq(emailAccounts.id, accountId));

        console.log('✅ Marked sync as complete');
      });

      console.log(`🎉 Microsoft sync complete!`);
      console.log(`   Total emails synced: ${totalEmailsSynced}`);
      console.log(`   Folders processed: ${folders.length}`);

      return {
        success: true,
        emailsSynced: totalEmailsSynced,
        foldersProcessed: folders.length,
        syncMode,
        trigger,
      };
    } catch (error) {
      console.error('❌ Microsoft sync failed:', error);

      // Check if status was already updated during error handling (e.g., token refresh failure)
      const currentAccount = await db.query.emailAccounts.findFirst({
        where: eq(emailAccounts.id, accountId),
      });

      // Only update status if not already set to idle (prevents duplicate updates)
      if (currentAccount && currentAccount.syncStatus !== 'idle') {
        await db
          .update(emailAccounts)
          .set({
            syncStatus: 'idle', // ALWAYS reset to idle on ANY error
            syncProgress: 0,
            status:
              error instanceof Error &&
              (error.message.includes('401') ||
                error.message.includes('Authentication'))
                ? 'error'
                : 'active',
            lastSyncError:
              error instanceof Error ? error.message : 'Unknown error',
            lastSyncAt: new Date(),
          } as any)
          .where(eq(emailAccounts.id, accountId));

        console.log('✅ Sync status reset to idle after error');
      } else {
        console.log('ℹ️ Sync status already reset (skipping duplicate update)');
      }

      // Re-throw to let Inngest handle retries
      throw error;
    }
  }
);

/**
 * Sync emails from a single folder
 * Handles both initial (full) and incremental (delta) sync
 */
async function syncFolderEmails(params: {
  accountId: string;
  userId: string;
  accessToken: string;
  folder: any;
  folderName: string;
  syncMode: 'initial' | 'incremental';
  account: any;
}): Promise<{ emailsSynced: number }> {
  const {
    accountId,
    userId,
    accessToken,
    folder,
    folderName,
    syncMode,
    account,
  } = params;

  const folderExternalId = folder.id;

  // Get folder record to check for delta link
  const folderRecord = await db.query.emailFolders.findFirst({
    where: and(
      eq(emailFolders.accountId, accountId),
      eq(emailFolders.externalId, folderExternalId)
    ),
  });

  // CRITICAL: Only use delta sync for incremental mode
  // NEVER use delta sync if syncMode is 'initial' - this prevents the 0 emails loop
  const useDeltaSync =
    syncMode === 'incremental' &&
    folderRecord?.syncCursor &&
    folderRecord.syncCursor.includes('delta');

  let currentUrl: string;

  if (useDeltaSync) {
    // Incremental sync: use saved delta link
    currentUrl = folderRecord!.syncCursor!;
    console.log(`  📊 Using delta sync for "${folderName}"`);
  } else {
    // Initial sync: full sync with delta token
    // NOTE: NOT using $expand=attachments because it breaks delta queries for large mailboxes
    // We'll fetch attachments separately if needed
    // REMOVED $top parameter - let Graph API decide optimal page size (usually 100-200)
    // The Graph API was ignoring our $top=200 and returning only 10 per page
    currentUrl = `https://graph.microsoft.com/v1.0/me/mailFolders/${folderExternalId}/messages/delta?$select=id,conversationId,subject,from,toRecipients,ccRecipients,bccRecipients,receivedDateTime,sentDateTime,isRead,body,bodyPreview,hasAttachments,importance,categories,flag,parentFolderId,internetMessageId`;
    console.log(
      `  🔄 Full sync for "${folderName}" (expected: ${folder.totalItemCount || 0} emails)`
    );
  }

  let totalSynced = 0;
  let finalDeltaLink: string | null = null;

  // Mark folder as syncing
  if (folderRecord) {
    await db
      .update(emailFolders)
      .set({ syncStatus: 'syncing', updatedAt: new Date() } as any)
      .where(eq(emailFolders.id, folderRecord.id));
  }

  // Pagination loop
  while (currentUrl) {
    const response = await fetch(currentUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Graph API error: ${response.status}`);
    }

    const data = await response.json();
    const messages = data.value || [];

    console.log(
      `  📧 Processing batch of ${messages.length} emails (total synced so far: ${totalSynced})`
    );

    // Process messages
    for (const message of messages) {
      try {
        const [inserted] = await db
          .insert(emails)
          .values({
            accountId,
            userId,
            externalId: message.id,
            messageId: message.internetMessageId || message.id,
            conversationId: message.conversationId,
            subject: message.subject || '(No Subject)',
            fromAddress: {
              name: message.from?.emailAddress?.name || '',
              email: message.from?.emailAddress?.address || '',
            },
            toAddresses: message.toRecipients
              ? message.toRecipients.map((r: any) => ({
                  name: r.emailAddress?.name || '',
                  email: r.emailAddress?.address || '',
                }))
              : [],
            ccAddresses: message.ccRecipients
              ? message.ccRecipients.map((r: any) => ({
                  name: r.emailAddress?.name || '',
                  email: r.emailAddress?.address || '',
                }))
              : [],
            bccAddresses: message.bccRecipients
              ? message.bccRecipients.map((r: any) => ({
                  name: r.emailAddress?.name || '',
                  email: r.emailAddress?.address || '',
                }))
              : [],
            receivedAt: new Date(message.receivedDateTime),
            sentAt: message.sentDateTime
              ? new Date(message.sentDateTime)
              : null,
            isRead: message.isRead || false,
            // Store FULL email body content
            bodyHtml:
              message.body?.contentType === 'html'
                ? message.body?.content
                : null,
            bodyText:
              message.body?.contentType === 'text'
                ? message.body?.content
                : null,
            bodyPreview: message.bodyPreview || '',
            hasAttachments: message.hasAttachments || false,
            // Attachments will be fetched separately if needed
            attachments: [],
            importance: message.importance || 'normal',
            categories: message.categories || [],
            folderName: folderName,
            folderId: folderRecord?.id || null,
            // Categorize based on folder name
            emailCategory: categorizeFolderName(folderName),
            screeningStatus: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any)
          .onConflictDoUpdate({
            target: [emails.accountId, emails.messageId],
            set: {
              subject: message.subject || '(No Subject)',
              isRead: message.isRead || false,
              bodyHtml:
                message.body?.contentType === 'html'
                  ? message.body?.content
                  : null,
              bodyText:
                message.body?.contentType === 'text'
                  ? message.body?.content
                  : null,
              bodyPreview: message.bodyPreview || '',
              hasAttachments: message.hasAttachments || false,
              // Attachments will be fetched separately if needed
              attachments: [],
              folderName: folderName,
              folderId: folderRecord?.id || null,
              updatedAt: new Date(),
            } as any,
          })
          .returning();

        // Count as synced even if it was an update
        totalSynced++;
      } catch (error) {
        console.error(`  ❌ Error inserting email ${message.id}:`, error);
        // Continue processing other emails
      }
    }

    // Get next page or delta link
    const nextLink = data['@odata.nextLink'];
    const deltaLink = data['@odata.deltaLink'];

    if (nextLink) {
      currentUrl = nextLink;
      console.log(`  ➡️  Fetching next page (${totalSynced} synced)...`);
    } else if (deltaLink) {
      finalDeltaLink = deltaLink;
      currentUrl = ''; // Exit loop
      console.log(`  ✅ All pages fetched - Total synced: ${totalSynced}`);
    } else {
      // No next link or delta link - exit loop
      currentUrl = ''; // Exit loop
      console.log(
        `  ⚠️  No next/delta link - Stopping at ${totalSynced} emails`
      );
    }

    // Rate limit protection
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Save delta link for next incremental sync
  // CRITICAL: Only save delta link if we synced emails close to the expected count
  // This prevents premature delta link saving when the sync is incomplete
  const expectedCount = folder.totalItemCount || 0;
  const syncedPercentage =
    expectedCount > 0 ? (totalSynced / expectedCount) * 100 : 100;

  if (finalDeltaLink && folderRecord) {
    // Only save delta link if:
    // 1. We synced at least 80% of expected emails, OR
    // 2. The folder has less than 50 emails (small folders are fine)
    // 3. We're in incremental mode (always save for delta syncs)
    const shouldSaveDeltaLink =
      syncMode === 'incremental' ||
      syncedPercentage >= 80 ||
      expectedCount < 50;

    if (shouldSaveDeltaLink) {
      await db
        .update(emailFolders)
        .set({
          syncCursor: finalDeltaLink,
          lastSyncAt: new Date(),
          syncStatus: 'idle',
        } as any)
        .where(eq(emailFolders.id, folderRecord.id));

      console.log(
        `  ✅ Delta link saved for folder "${folderName}" (${syncedPercentage.toFixed(1)}% synced)`
      );
    } else {
      console.log(
        `  ⚠️  NOT saving delta link - only ${syncedPercentage.toFixed(1)}% synced (${totalSynced}/${expectedCount})`
      );
      console.log(`     Will continue full sync on next run`);
    }
  }

  return { emailsSynced: totalSynced };
}

/**
 * Normalize folder display names to standard names
 */
function normalizeFolderName(displayName: string): string {
  const mapping: Record<string, string> = {
    Inbox: 'inbox',
    'Sent Items': 'sent',
    Drafts: 'drafts',
    'Deleted Items': 'trash',
    'Junk Email': 'spam',
    Archive: 'archive',
  };
  return mapping[displayName] || displayName.toLowerCase().replace(/\s+/g, '-');
}
