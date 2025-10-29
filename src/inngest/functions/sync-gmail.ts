/**
 * Gmail Email Synchronization - Inngest Function
 *
 * Syncs emails and folders from Gmail accounts using Gmail API
 */

import { inngest } from '@/inngest/client';
import { db } from '@/db';
import {
  emailAccounts,
  emailFolders,
  emails,
  syncJobs,
  type CoreFolderType,
} from '@/db/schema';
import { eq, and, gt, lt } from 'drizzle-orm';
import { google } from 'googleapis';
import {
  detectFolderType,
  shouldSyncByDefault,
} from '@/lib/folders/folder-mapper';

// ============================================================================
// GMAIL SYNC FUNCTION
// ============================================================================

export const syncGmailAccount = inngest.createFunction(
  {
    id: 'sync-gmail-account',
    name: 'Sync Gmail Account',
    retries: 3,
  },
  { event: 'email/sync.gmail' },
  async ({ event, step }) => {
    const { accountId, userId, fullSync = false } = event.data;

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

    // Step 2: Create sync job
    const jobId = await step.run('create-sync-job', async () => {
      const [job] = await db
        .insert(syncJobs)
        .values({
          accountId,
          userId,
          status: 'running',
          syncType: fullSync ? 'full' : 'incremental',
          startedAt: new Date(),
        })
        .returning();
      return job.id;
    });

    try {
      // Step 2: Get account credentials
      const account = await step.run('get-account', async () => {
        const [acc] = await db
          .select()
          .from(emailAccounts)
          .where(eq(emailAccounts.id, accountId));

        if (!acc || acc.provider !== 'google') {
          throw new Error('Gmail account not found or invalid provider');
        }

        return acc;
      });

      // Step 3: Initialize Gmail API
      const gmail = await step.run('init-gmail-client', async () => {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );

        oauth2Client.setCredentials({
          access_token: account.accessToken,
          refresh_token: account.refreshToken,
        });

        return google.gmail({ version: 'v1', auth: oauth2Client });
      });

      // Step 4: Sync folders (Gmail labels)
      const syncedFolders = await step.run('sync-folders', async () => {
        const response = await gmail.users.labels.list({ userId: 'me' });
        const labels = response.data.labels || [];

        console.log(
          `[Gmail] Found ${labels.length} labels for account ${accountId}`
        );

        const folderData = [];

        for (const label of labels) {
          // Detect folder type using our comprehensive mapper
          const folderType = detectFolderType(label.name || '', 'google');

          // Get existing folder or create new
          const [folder] = await db
            .select()
            .from(emailFolders)
            .where(
              and(
                eq(emailFolders.accountId, accountId),
                eq(emailFolders.providerId, label.id || '')
              )
            );

          if (folder) {
            // Update existing folder
            await db
              .update(emailFolders)
              .set({
                name: label.name || '',
                displayName: label.name || '',
                folderType,
                messageCount: label.messagesTotal || 0,
                unreadCount: label.messagesUnread || 0,
                lastSyncedAt: new Date(),
              })
              .where(eq(emailFolders.id, folder.id));

            folderData.push(folder);
          } else {
            // Create new folder
            const [newFolder] = await db
              .insert(emailFolders)
              .values({
                accountId,
                userId,
                providerId: label.id || '',
                name: label.name || '',
                displayName: label.name || '',
                folderType,
                messageCount: label.messagesTotal || 0,
                unreadCount: label.messagesUnread || 0,
                syncEnabled: shouldSyncByDefault(folderType), // FIXED - uses logic
                lastSyncedAt: new Date(),
              })
              .returning();

            folderData.push(newFolder);
          }
        }

        console.log(`[Gmail] Synced ${folderData.length} folders`);
        return folderData;
      });

      // Step 5: Sync emails for each folder
      let totalEmailsSynced = 0;
      let totalErrors = 0;

      for (const folder of syncedFolders) {
        // Skip if sync disabled
        if (!folder.syncEnabled) continue;

        // Skip system folders we don't want to sync
        if (folder.folderType === 'spam' || folder.folderType === 'trash') {
          console.log(`[Gmail] Skipping ${folder.name} (${folder.folderType})`);
          continue;
        }

        const result = await step.run(`sync-folder-${folder.id}`, async () => {
          try {
            // Get last sync cursor (historyId for incremental sync)
            const lastHistoryId = fullSync ? null : account.lastSyncCursor;

            let messages: any[] = [];

            if (lastHistoryId) {
              // Incremental sync using history API
              try {
                const historyResponse = await gmail.users.history.list({
                  userId: 'me',
                  startHistoryId: lastHistoryId,
                  labelId: folder.providerId,
                });

                const history = historyResponse.data.history || [];
                const messageIds = new Set<string>();

                for (const historyItem of history) {
                  // Collect messages added
                  if (historyItem.messagesAdded) {
                    historyItem.messagesAdded.forEach((added) => {
                      if (added.message?.id) {
                        messageIds.add(added.message.id);
                      }
                    });
                  }

                  // Collect messages modified
                  if (historyItem.messagesDeleted) {
                    historyItem.messagesDeleted.forEach((deleted) => {
                      if (deleted.message?.id) {
                        messageIds.add(deleted.message.id);
                      }
                    });
                  }
                }

                // Fetch full message details
                for (const messageId of Array.from(messageIds)) {
                  const msg = await gmail.users.messages.get({
                    userId: 'me',
                    id: messageId,
                    format: 'full',
                  });
                  messages.push(msg.data);
                }

                console.log(
                  `[Gmail] Incremental sync: ${messages.length} messages for ${folder.name}`
                );
              } catch (error: any) {
                if (error.code === 404) {
                  // History expired, fallback to full sync
                  console.log(
                    `[Gmail] History expired for ${folder.name}, doing full sync`
                  );
                  const response = await gmail.users.messages.list({
                    userId: 'me',
                    labelIds: [folder.providerId],
                    maxResults: 100, // Limit for performance
                  });
                  messages = response.data.messages || [];
                } else {
                  throw error;
                }
              }
            } else {
              // Full sync: Get all messages in folder (limited)
              const response = await gmail.users.messages.list({
                userId: 'me',
                labelIds: [folder.providerId],
                maxResults: 100, // Limit for initial sync
              });

              const messageList = response.data.messages || [];

              // Fetch full message details in batches
              for (const msg of messageList) {
                const fullMsg = await gmail.users.messages.get({
                  userId: 'me',
                  id: msg.id || '',
                  format: 'full',
                });
                messages.push(fullMsg.data);
              }

              console.log(
                `[Gmail] Full sync: ${messages.length} messages for ${folder.name}`
              );
            }

            // Process and insert emails
            let synced = 0;

            for (const message of messages) {
              try {
                const headers = message.payload?.headers || [];
                const getHeader = (name: string) =>
                  headers.find(
                    (h: any) => h.name.toLowerCase() === name.toLowerCase()
                  )?.value || null;

                // Parse email data
                const from = getHeader('From') || '';
                const to = getHeader('To') || '';
                const subject = getHeader('Subject') || '(No Subject)';
                const date = getHeader('Date');
                const messageId = getHeader('Message-ID') || message.id;
                const inReplyTo = getHeader('In-Reply-To');
                const references = getHeader('References');

                // Get body
                let body = '';
                if (message.payload?.body?.data) {
                  body = Buffer.from(
                    message.payload.body.data,
                    'base64'
                  ).toString('utf-8');
                } else if (message.payload?.parts) {
                  const textPart = message.payload.parts.find(
                    (p: any) => p.mimeType === 'text/plain'
                  );
                  if (textPart?.body?.data) {
                    body = Buffer.from(textPart.body.data, 'base64').toString(
                      'utf-8'
                    );
                  }
                }

                // Check if email already exists
                const [existing] = await db
                  .select()
                  .from(emails)
                  .where(
                    and(
                      eq(emails.accountId, accountId),
                      eq(emails.providerId, message.id || '')
                    )
                  );

                if (existing) {
                  // Update existing email
                  await db
                    .update(emails)
                    .set({
                      folderId: folder.id,
                      isRead: !message.labelIds?.includes('UNREAD'),
                      isStarred: message.labelIds?.includes('STARRED') || false,
                      updatedAt: new Date(),
                    })
                    .where(eq(emails.id, existing.id));
                } else {
                  // Insert new email
                  await db.insert(emails).values({
                    accountId,
                    userId,
                    folderId: folder.id,
                    providerId: message.id || '',
                    messageId: messageId || message.id || '',
                    from,
                    to,
                    subject,
                    body,
                    receivedAt: date ? new Date(date) : new Date(),
                    isRead: !message.labelIds?.includes('UNREAD'),
                    isStarred: message.labelIds?.includes('STARRED') || false,
                    inReplyTo,
                    references,
                  });
                }

                synced++;
              } catch (emailError) {
                console.error(
                  `[Gmail] Error processing message ${message.id}:`,
                  emailError
                );
                totalErrors++;
              }
            }

            return synced;
          } catch (folderError) {
            console.error(
              `[Gmail] Error syncing folder ${folder.name}:`,
              folderError
            );
            totalErrors++;
            return 0;
          }
        });

        totalEmailsSynced += result;
      }

      // Step 6: Update sync cursor (latest historyId)
      await step.run('update-sync-cursor', async () => {
        const profile = await gmail.users.getProfile({ userId: 'me' });
        const newHistoryId = profile.data.historyId;

        if (newHistoryId) {
          await db
            .update(emailAccounts)
            .set({
              lastSyncCursor: newHistoryId,
              lastSyncedAt: new Date(),
            })
            .where(eq(emailAccounts.id, accountId));
        }
      });

      // Step 7: Mark sync job as completed
      await step.run('complete-sync-job', async () => {
        await db
          .update(syncJobs)
          .set({
            status: 'completed',
            completedAt: new Date(),
            emailsProcessed: totalEmailsSynced,
            emailsFailed: totalErrors,
          })
          .where(eq(syncJobs.id, jobId));
      });

      return {
        success: true,
        foldersSync: syncedFolders.length,
        emailsSynced: totalEmailsSynced,
        errors: totalErrors,
      };
    } catch (error) {
      // Mark sync job as failed
      await step.run('mark-sync-failed', async () => {
        await db
          .update(syncJobs)
          .set({
            status: 'failed',
            completedAt: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          .where(eq(syncJobs.id, jobId));
      });

      throw error;
    }
  }
);
