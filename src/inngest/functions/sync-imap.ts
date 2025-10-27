/**
 * IMAP Email Synchronization - Inngest Function
 *
 * Syncs emails and folders from IMAP accounts
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
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { detectFolderType } from '@/lib/folders/folder-mapper';

// ============================================================================
// IMAP SYNC FUNCTION
// ============================================================================

export const syncImapAccount = inngest.createFunction(
  {
    id: 'sync-imap-account',
    name: 'Sync IMAP Account',
    retries: 3,
  },
  { event: 'email/sync.imap' },
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

        if (!acc || acc.provider !== 'imap') {
          throw new Error('IMAP account not found or invalid provider');
        }

        return acc;
      });

      // Step 3: Connect to IMAP server
      const imap = await step.run('connect-imap', async () => {
        return new Promise<Imap>((resolve, reject) => {
          const config = JSON.parse(account.imapConfig || '{}');

          const client = new Imap({
            user: account.emailAddress,
            password: account.accessToken, // For IMAP, we store password as accessToken
            host: config.host || 'imap.gmail.com',
            port: config.port || 993,
            tls: config.tls !== false,
            tlsOptions: { rejectUnauthorized: false },
          });

          client.once('ready', () => resolve(client));
          client.once('error', reject);
          client.connect();
        });
      });

      // Step 4: Sync folders
      const syncedFolders = await step.run('sync-folders', async () => {
        return new Promise<any[]>((resolve, reject) => {
          imap.getBoxes((err, boxes) => {
            if (err) return reject(err);

            const flattenBoxes = (boxTree: any, prefix = ''): any[] => {
              let result: any[] = [];

              for (const [name, box] of Object.entries(boxTree)) {
                const fullPath = prefix
                  ? `${prefix}${box.delimiter}${name}`
                  : name;

                result.push({
                  name,
                  fullPath,
                  delimiter: box.delimiter,
                  attribs: box.attribs || [],
                });

                // Recursively add children
                if (box.children) {
                  result = result.concat(flattenBoxes(box.children, fullPath));
                }
              }

              return result;
            };

            const folderList = flattenBoxes(boxes);

            // Process each folder
            const processedFolders = folderList.map(async (box) => {
              // Detect folder type using comprehensive mapper
              const folderType = detectFolderType(box.fullPath, 'imap');

              // Check if folder exists
              const [existingFolder] = await db
                .select()
                .from(emailFolders)
                .where(
                  and(
                    eq(emailFolders.accountId, accountId),
                    eq(emailFolders.providerId, box.fullPath)
                  )
                );

              if (existingFolder) {
                // Update existing folder
                await db
                  .update(emailFolders)
                  .set({
                    name: box.fullPath,
                    displayName: box.name,
                    folderType,
                    lastSyncedAt: new Date(),
                  })
                  .where(eq(emailFolders.id, existingFolder.id));

                return existingFolder;
              } else {
                // Create new folder
                const [newFolder] = await db
                  .insert(emailFolders)
                  .values({
                    accountId,
                    userId,
                    providerId: box.fullPath,
                    name: box.fullPath,
                    displayName: box.name,
                    folderType,
                    messageCount: 0,
                    unreadCount: 0,
                    syncEnabled: true,
                    lastSyncedAt: new Date(),
                  })
                  .returning();

                return newFolder;
              }
            });

            Promise.all(processedFolders).then(resolve).catch(reject);
          });
        });
      });

      console.log(`[IMAP] Synced ${syncedFolders.length} folders`);

      // Step 5: Sync emails for each folder
      let totalEmailsSynced = 0;
      let totalErrors = 0;

      for (const folder of syncedFolders) {
        // Skip if sync disabled
        if (!folder.syncEnabled) continue;

        // Skip system folders we don't want to sync
        if (folder.folderType === 'spam' || folder.folderType === 'trash') {
          console.log(`[IMAP] Skipping ${folder.name} (${folder.folderType})`);
          continue;
        }

        const result = await step.run(`sync-folder-${folder.id}`, async () => {
          try {
            return new Promise<number>((resolve, reject) => {
              imap.openBox(folder.providerId, false, async (err, box) => {
                if (err) return reject(err);

                const totalMessages = box.messages.total;

                // Update folder message count
                await db
                  .update(emailFolders)
                  .set({ messageCount: totalMessages })
                  .where(eq(emailFolders.id, folder.id));

                if (totalMessages === 0) {
                  return resolve(0);
                }

                // Determine which messages to fetch
                let fetchRange: string;
                if (fullSync) {
                  // Full sync: last 100 messages
                  const start = Math.max(1, totalMessages - 99);
                  fetchRange = `${start}:${totalMessages}`;
                } else {
                  // Incremental: only new messages since last sync
                  const lastUID = folder.lastSyncCursor
                    ? parseInt(folder.lastSyncCursor)
                    : totalMessages - 10; // Last 10 if no cursor
                  fetchRange = `${lastUID + 1}:${totalMessages}`;
                }

                console.log(
                  `[IMAP] Fetching messages ${fetchRange} from ${folder.name}`
                );

                const fetch = imap.seq.fetch(fetchRange, {
                  bodies: '',
                  struct: true,
                });

                let synced = 0;

                fetch.on('message', (msg, seqno) => {
                  msg.on('body', async (stream) => {
                    try {
                      const parsed = await simpleParser(stream);

                      // Check if email already exists by Message-ID
                      const [existing] = await db
                        .select()
                        .from(emails)
                        .where(
                          and(
                            eq(emails.accountId, accountId),
                            eq(emails.messageId, parsed.messageId || `${seqno}`)
                          )
                        );

                      if (existing) {
                        // Update existing email
                        await db
                          .update(emails)
                          .set({
                            folderId: folder.id,
                            isRead: parsed.flags?.includes('\\Seen') || false,
                            isStarred:
                              parsed.flags?.includes('\\Flagged') || false,
                            updatedAt: new Date(),
                          })
                          .where(eq(emails.id, existing.id));
                      } else {
                        // Insert new email
                        await db.insert(emails).values({
                          accountId,
                          userId,
                          folderId: folder.id,
                          providerId: `${seqno}`,
                          messageId: parsed.messageId || `${seqno}`,
                          from: parsed.from?.text || '',
                          to: parsed.to?.text || '',
                          subject: parsed.subject || '(No Subject)',
                          body: parsed.text || parsed.html || '',
                          receivedAt: parsed.date || new Date(),
                          isRead: parsed.flags?.includes('\\Seen') || false,
                          isStarred:
                            parsed.flags?.includes('\\Flagged') || false,
                          inReplyTo: parsed.inReplyTo || null,
                          references: parsed.references?.join(',') || null,
                        });
                      }

                      synced++;
                    } catch (emailError) {
                      console.error(
                        `[IMAP] Error processing message ${seqno}:`,
                        emailError
                      );
                      totalErrors++;
                    }
                  });
                });

                fetch.once('error', reject);
                fetch.once('end', () => {
                  // Update sync cursor to last message UID
                  db.update(emailFolders)
                    .set({ lastSyncCursor: `${totalMessages}` })
                    .where(eq(emailFolders.id, folder.id))
                    .then(() => resolve(synced))
                    .catch(reject);
                });
              });
            });
          } catch (folderError) {
            console.error(
              `[IMAP] Error syncing folder ${folder.name}:`,
              folderError
            );
            totalErrors++;
            return 0;
          }
        });

        totalEmailsSynced += result;
      }

      // Step 6: Close IMAP connection
      await step.run('disconnect-imap', async () => {
        imap.end();
      });

      // Step 7: Update account last synced
      await step.run('update-account', async () => {
        await db
          .update(emailAccounts)
          .set({ lastSyncedAt: new Date() })
          .where(eq(emailAccounts.id, accountId));
      });

      // Step 8: Mark sync job as completed
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
        foldersSynced: syncedFolders.length,
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
