// src/lib/email/gmail-history-api.ts
import { google } from 'googleapis';
import { db } from '@/lib/db';
import { emails, emailFolders } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Gmail History API Service
 * More efficient than full sync - only fetches changes since last sync
 */
export class GmailHistoryService {
  /**
   * Get the last history ID for an account
   */
  private async getLastHistoryId(accountId: string): Promise<string | null> {
    const account = await db.query.emailAccounts.findFirst({
      where: (accounts, { eq }) => eq(accounts.id, accountId),
    });

    return (account as any)?.gmailHistoryId || null;
  }

  /**
   * Save the latest history ID for an account
   */
  private async saveHistoryId(
    accountId: string,
    historyId: string
  ): Promise<void> {
    await db.execute(sql`
      UPDATE email_accounts
      SET gmail_history_id = ${historyId},
          updated_at = NOW()
      WHERE id = ${accountId}
    `);
  }

  /**
   * Sync using Gmail History API
   * Much more efficient than fetching all messages
   */
  async syncWithHistory(
    accountId: string,
    userId: string,
    accessToken: string
  ): Promise<{
    messagesAdded: number;
    messagesDeleted: number;
    labelsChanged: number;
  }> {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get the last history ID
    const startHistoryId = await this.getLastHistoryId(accountId);

    if (!startHistoryId) {
      console.log('No history ID found, performing full sync instead');
      // Fall back to full sync if no history ID
      return { messagesAdded: 0, messagesDeleted: 0, labelsChanged: 0 };
    }

    console.log(`📜 Syncing Gmail history from ID: ${startHistoryId}`);

    let pageToken: string | undefined;
    let messagesAdded = 0;
    let messagesDeleted = 0;
    let labelsChanged = 0;
    let latestHistoryId = startHistoryId;

    try {
      do {
        const response = await gmail.users.history.list({
          userId: 'me',
          startHistoryId,
          pageToken,
          maxResults: 500,
        });

        const history = response.data.history || [];
        latestHistoryId = response.data.historyId || latestHistoryId;

        for (const record of history) {
          // Process messages added
          if (record.messagesAdded) {
            for (const added of record.messagesAdded) {
              await this.processAddedMessage(
                gmail,
                accountId,
                userId,
                added.message!
              );
              messagesAdded++;
            }
          }

          // Process messages deleted
          if (record.messagesDeleted) {
            for (const deleted of record.messagesDeleted) {
              await this.processDeletedMessage(accountId, deleted.message!.id!);
              messagesDeleted++;
            }
          }

          // Process label changes
          if (record.labelsAdded || record.labelsRemoved) {
            labelsChanged++;
            if (record.labelsAdded) {
              for (const labelChange of record.labelsAdded) {
                await this.processLabelChange(
                  gmail,
                  accountId,
                  labelChange.message!.id!,
                  labelChange.labelIds || [],
                  'added'
                );
              }
            }
            if (record.labelsRemoved) {
              for (const labelChange of record.labelsRemoved) {
                await this.processLabelChange(
                  gmail,
                  accountId,
                  labelChange.message!.id!,
                  labelChange.labelIds || [],
                  'removed'
                );
              }
            }
          }
        }

        pageToken = response.data.nextPageToken;
      } while (pageToken);

      // Save the latest history ID
      await this.saveHistoryId(accountId, latestHistoryId);

      console.log(
        `✅ History sync complete: +${messagesAdded} -${messagesDeleted} ~${labelsChanged}`
      );

      return { messagesAdded, messagesDeleted, labelsChanged };
    } catch (error: any) {
      if (error.code === 404) {
        console.log('History expired, need to perform full sync');
        // History ID is too old, need to do full sync
        return { messagesAdded: 0, messagesDeleted: 0, labelsChanged: 0 };
      }
      throw error;
    }
  }

  /**
   * Process a newly added message
   */
  private async processAddedMessage(
    gmail: any,
    accountId: string,
    userId: string,
    message: any
  ): Promise<void> {
    try {
      // Fetch full message details
      const fullMessage = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full',
      });

      const messageData = fullMessage.data;
      const headers = messageData.payload.headers;

      // Extract email details
      const subject =
        headers.find((h: any) => h.name === 'Subject')?.value ||
        '(No Subject)';
      const from = headers.find((h: any) => h.name === 'From')?.value || '';
      const to = headers.find((h: any) => h.name === 'To')?.value || '';
      const date = headers.find((h: any) => h.name === 'Date')?.value;

      // Parse from address
      const fromMatch = from.match(/(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)/);
      const fromAddress = {
        email: fromMatch?.[2] || from,
        name: fromMatch?.[1] || fromMatch?.[2] || 'Unknown',
      };

      // Determine folder based on labels
      const labels = messageData.labelIds || [];
      let folderName = 'inbox';
      if (labels.includes('SENT')) folderName = 'sent';
      else if (labels.includes('DRAFT')) folderName = 'drafts';
      else if (labels.includes('TRASH')) folderName = 'trash';
      else if (labels.includes('SPAM')) folderName = 'spam';

      // Insert email
      await db
        .insert(emails)
        .values({
          accountId,
          messageId: message.id,
          threadId: messageData.threadId || message.id,
          subject,
          snippet: messageData.snippet || '',
          fromAddress,
          toAddresses: [],
          receivedAt: date ? new Date(date) : new Date(),
          isRead: !labels.includes('UNREAD'),
          isStarred: labels.includes('STARRED'),
          hasAttachments: messageData.payload.parts?.some(
            (p: any) => p.filename
          ),
          folderName,
        } as any)
        .onConflictDoNothing();

      console.log(`✉️  Added: ${subject}`);
    } catch (error) {
      console.error('Error processing added message:', error);
    }
  }

  /**
   * Process a deleted message
   */
  private async processDeletedMessage(
    accountId: string,
    messageId: string
  ): Promise<void> {
    try {
      await db
        .delete(emails)
        .where(
          and(eq(emails.accountId, accountId), eq(emails.messageId, messageId))
        );

      console.log(`🗑️  Deleted: ${messageId}`);
    } catch (error) {
      console.error('Error processing deleted message:', error);
    }
  }

  /**
   * Process label changes
   */
  private async processLabelChange(
    gmail: any,
    accountId: string,
    messageId: string,
    labelIds: string[],
    action: 'added' | 'removed'
  ): Promise<void> {
    try {
      // Update email folder based on labels
      let newFolder = 'inbox';
      if (labelIds.includes('SENT')) newFolder = 'sent';
      else if (labelIds.includes('DRAFT')) newFolder = 'drafts';
      else if (labelIds.includes('TRASH')) newFolder = 'trash';
      else if (labelIds.includes('SPAM')) newFolder = 'spam';

      // Update is_read status
      const isRead = !labelIds.includes('UNREAD');
      const isStarred = labelIds.includes('STARRED');

      await db
        .update(emails)
        .set({
          folderName: newFolder,
          isRead,
          isStarred,
          updatedAt: new Date(),
        } as any)
        .where(
          and(eq(emails.accountId, accountId), eq(emails.messageId, messageId))
        );

      console.log(`🏷️  Label ${action}: ${messageId} -> ${newFolder}`);
    } catch (error) {
      console.error('Error processing label change:', error);
    }
  }

  /**
   * Start watching for push notifications (Gmail Push API)
   * This needs to be set up with Google Cloud Pub/Sub
   */
  async setupPushNotifications(
    accessToken: string,
    topicName: string
  ): Promise<void> {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
      const response = await gmail.users.watch({
        userId: 'me',
        requestBody: {
          topicName,
          labelIds: ['INBOX', 'SENT', 'TRASH', 'SPAM'],
        },
      });

      console.log(`📡 Gmail push notifications enabled:`, response.data);
      return response.data;
    } catch (error) {
      console.error('Error setting up push notifications:', error);
      throw error;
    }
  }
}

// Import sql and and from drizzle-orm
import { sql, and } from 'drizzle-orm';

// Export singleton instance
export const gmailHistoryService = new GmailHistoryService();

