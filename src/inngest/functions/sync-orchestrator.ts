import { inngest } from '../client';
import { db } from '@/lib/db';
import { emailAccounts, emailFolders, emails } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { MicrosoftProvider } from '@/lib/sync/providers/microsoft';
import { GmailProvider } from '@/lib/sync/providers/gmail';
import { ImapProvider } from '@/lib/sync/providers/imap';
import { SyncProvider, ProviderFolder } from '@/lib/sync/providers/base';
import {
  detectFolderType,
  shouldSyncByDefault,
} from '@/lib/folders/folder-mapper';

/**
 * Unified Sync Orchestrator - Inngest Function
 * Routes sync requests to the appropriate provider and handles all sync logic
 */
export const syncOrchestrator = inngest.createFunction(
  {
    id: 'sync-orchestrator',
    retries: 3,
    concurrency: {
      limit: 5, // Max 5 accounts syncing simultaneously
      key: 'event.data.accountId', // One sync per account at a time
    },
  },
  { event: 'sync/account' },
  async ({ event, step }) => {
    const { accountId, userId, provider, syncMode, trigger } = event.data;

    console.log(`🚀 Sync orchestrator started`);
    console.log(`   Account ID: ${accountId}`);
    console.log(`   Provider: ${provider}`);
    console.log(`   Mode: ${syncMode}`);
    console.log(`   Trigger: ${trigger}`);

    try {
      // Step 1: Get account
      const account = await step.run('get-account', async () => {
        const acc = await db.query.emailAccounts.findFirst({
          where: eq(emailAccounts.id, accountId),
        });

        if (!acc) {
          throw new Error(`Account not found: ${accountId}`);
        }

        console.log(`✅ Account found: ${acc.emailAddress}`);
        return acc;
      });

      // Step 2: Initialize provider
      let syncProvider: SyncProvider;

      if (provider === 'microsoft') {
        syncProvider = new MicrosoftProvider(
          account.accessToken!,
          account.refreshToken!,
          accountId
        );
      } else if (provider === 'gmail' || provider === 'google') {
        syncProvider = new GmailProvider(
          account.accessToken!,
          account.refreshToken!,
          accountId
        );
      } else if (provider === 'imap' || provider === 'yahoo') {
        // Parse IMAP config from account
        const imapConfig = {
          user: account.imapUsername || account.emailAddress,
          password: account.imapPassword || '',
          host: account.imapHost || '',
          port: account.imapPort || 993,
          tls: true,
        };
        syncProvider = new ImapProvider(imapConfig, accountId);
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      console.log(`✅ Provider initialized: ${syncProvider.name}`);

      // Step 3: Refresh token if needed
      await step.run('refresh-token', async () => {
        if (account.tokenExpiresAt) {
          const expiresAt = new Date(account.tokenExpiresAt);
          const now = new Date();
          const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

          if (expiresAt <= fiveMinutesFromNow) {
            console.log('🔄 Token expiring soon, refreshing...');
            await syncProvider.refreshToken();
          } else {
            console.log(`✅ Token valid until ${expiresAt.toISOString()}`);
          }
        }
      });

      // Step 4: Sync folders
      const folders = await step.run('sync-folders', async () => {
        console.log('📁 Syncing folders...');
        const providerFolders = await syncProvider.fetchFolders();

        // Upsert folders to database
        for (const folder of providerFolders) {
          await db
            .insert(emailFolders)
            .values({
              accountId,
              userId,
              externalId: folder.id,
              name: folder.name,
              type: detectFolderType(folder.name),
              messageCount: folder.totalMessages,
              unreadCount: folder.unreadMessages,
              enabled: shouldSyncByDefault(folder.name),
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any)
            .onConflictDoUpdate({
              target: [emailFolders.accountId, emailFolders.externalId],
              set: {
                messageCount: folder.totalMessages,
                unreadCount: folder.unreadMessages,
                updatedAt: new Date(),
              },
            });
        }

        console.log(`✅ Synced ${providerFolders.length} folders`);
        return providerFolders;
      });

      // Step 5: Sync emails from each folder
      let totalSynced = 0;

      for (const folder of folders) {
        const synced = await step.run(`sync-folder-${folder.id}`, async () => {
          return await syncFolderEmails(
            syncProvider,
            folder,
            accountId,
            userId,
            syncMode
          );
        });
        totalSynced += synced;
      }

      // Step 6: Mark sync complete
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
            updatedAt: new Date(),
          } as any)
          .where(eq(emailAccounts.id, accountId));

        console.log('✅ Sync marked as complete');
      });

      console.log(`🎉 Sync complete! Total emails synced: ${totalSynced}`);

      return {
        success: true,
        emailsSynced: totalSynced,
        foldersProcessed: folders.length,
        syncMode,
        trigger,
      };
    } catch (error) {
      console.error('❌ Sync failed:', error);

      // Update account with error
      await db
        .update(emailAccounts)
        .set({
          syncStatus: 'idle',
          status:
            error instanceof Error &&
            (error.message.includes('401') ||
              error.message.includes('403') ||
              error.message.includes('Unauthorized'))
              ? 'error'
              : 'active',
          lastSyncError:
            error instanceof Error ? error.message : 'Unknown error',
          lastSyncAt: new Date(),
          syncProgress: 0,
          updatedAt: new Date(),
        } as any)
        .where(eq(emailAccounts.id, accountId));

      throw error; // Let Inngest handle retries
    }
  }
);

/**
 * Sync emails from a single folder
 */
async function syncFolderEmails(
  provider: SyncProvider,
  folder: ProviderFolder,
  accountId: string,
  userId: string,
  syncMode: 'initial' | 'incremental'
): Promise<number> {
  console.log(`📧 Syncing folder: ${folder.name}`);

  // Get folder record from database
  const folderRecord = await db.query.emailFolders.findFirst({
    where: and(
      eq(emailFolders.accountId, accountId),
      eq(emailFolders.externalId, folder.id)
    ),
  });

  if (!folderRecord) {
    console.error(`❌ Folder record not found: ${folder.name}`);
    return 0;
  }

  // Get cursor for incremental sync
  const cursor =
    syncMode === 'incremental' ? folderRecord.syncCursor || undefined : undefined;

  let totalSynced = 0;
  let hasMore = true;
  let nextCursor = cursor;

  // Pagination loop
  while (hasMore) {
    const { emails: providerEmails, nextCursor: newCursor, hasMore: more } =
      await provider.fetchEmails(folder.id, nextCursor);

    console.log(`   Batch: ${providerEmails.length} emails`);

    // Insert emails into database
    for (const email of providerEmails) {
      try {
        await db
          .insert(emails)
          .values({
            accountId,
            userId,
            messageId: email.messageId,
            providerId: email.id,
            subject: email.subject,
            fromAddress: email.from as any,
            toAddresses: email.to as any,
            ccAddresses: email.cc as any,
            bccAddresses: email.bcc as any,
            bodyHtml: email.bodyHtml,
            bodyText: email.bodyText,
            snippet: email.snippet,
            receivedAt: email.receivedAt,
            sentAt: email.sentAt,
            isRead: email.isRead,
            hasAttachments: email.hasAttachments,
            folderName: folder.name,
            folderId: folderRecord.id,
            labelIds: email.labels,
            emailCategory: categorizeFolderToCategory(folder.name),
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any)
          .onConflictDoUpdate({
            target: [emails.accountId, emails.messageId],
            set: {
              subject: email.subject,
              isRead: email.isRead,
              folderName: folder.name,
              folderId: folderRecord.id,
              updatedAt: new Date(),
            },
          });

        totalSynced++;
      } catch (error) {
        console.error(`⚠️ Failed to insert email: ${email.subject}`, error);
        // Continue with other emails
      }
    }

    hasMore = more;
    nextCursor = newCursor;

    // Save cursor for next incremental sync
    if (!hasMore && newCursor) {
      await db
        .update(emailFolders)
        .set({
          syncCursor: newCursor,
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        } as any)
        .where(eq(emailFolders.id, folderRecord.id));
    }
  }

  console.log(`✅ Folder ${folder.name}: ${totalSynced} emails synced`);
  return totalSynced;
}

/**
 * Map folder name to email category enum
 */
function categorizeFolderToCategory(folderName: string): string {
  const normalized = folderName.toLowerCase();

  if (normalized === 'inbox') return 'inbox';
  if (normalized === 'sent' || normalized === 'sent items') return 'sent';
  if (normalized === 'drafts') return 'drafts';
  if (normalized === 'junk' || normalized === 'spam') return 'junk';
  if (normalized === 'trash' || normalized === 'deleted items') return 'deleted';
  if (normalized === 'outbox') return 'outbox';

  return 'inbox'; // Default
}

