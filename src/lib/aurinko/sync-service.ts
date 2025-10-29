/**
 * Aurinko Sync Service
 * Handles email synchronization for IMAP and alternative email providers via Aurinko API
 */

import { db } from '@/lib/db';
import { emails, emailAccounts, emailFolders } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

interface AurinkoEmail {
  id: string;
  threadId: string;
  folderId: string;
  subject: string;
  from: { name?: string; email: string };
  to: Array<{ name?: string; email: string }>;
  cc?: Array<{ name?: string; email: string }>;
  bcc?: Array<{ name?: string; email: string }>;
  replyTo?: Array<{ name?: string; email: string }>;
  date: string;
  receivedDateTime: string;
  bodyPreview: string;
  body: string;
  bodyHtml?: string;
  hasAttachments: boolean;
  attachments?: Array<{
    id: string;
    name: string;
    size: number;
    contentType: string;
  }>;
  isRead: boolean;
  isFlagged: boolean;
  isDraft: boolean;
  labels?: string[];
}

interface AurinkoFolder {
  id: string;
  name: string;
  type: string; // 'Inbox', 'Sent', 'Drafts', 'Trash', 'Spam', 'Custom'
  unreadCount: number;
  totalCount: number;
}

/**
 * Sync emails from Aurinko for a specific account
 */
export async function syncAurinkoEmails(accountId: string): Promise<{
  success: boolean;
  emailCount?: number;
  error?: string;
}> {
  try {
    console.log(`🔵 Starting Aurinko sync for account: ${accountId}`);

    // Get account from database
    const account = await db.query.emailAccounts.findFirst({
      where: eq(emailAccounts.id, accountId),
    });

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    if (!account.useAurinko || !account.aurinkoAccessToken) {
      return { success: false, error: 'Not an Aurinko account' };
    }

    // Check if token is expired
    if (
      account.aurinkoTokenExpiresAt &&
      account.aurinkoTokenExpiresAt < new Date()
    ) {
      console.log('⚠️ Aurinko token expired, refreshing...');
      const refreshed = await refreshAurinkoToken(accountId);
      if (!refreshed.success) {
        return { success: false, error: 'Failed to refresh token' };
      }
    }

    // Fetch folders first
    await syncAurinkoFolders(accountId, account.aurinkoAccessToken);

    // Fetch emails from Aurinko API
    console.log('🔵 Fetching emails from Aurinko...');

    const response = await fetch(
      'https://api.aurinko.io/v1/email/messages?limit=100&includeBody=true',
      {
        headers: {
          Authorization: `Bearer ${account.aurinkoAccessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Aurinko API error:', errorText);
      return { success: false, error: `Aurinko API error: ${response.status}` };
    }

    const data = await response.json();
    const aurinkoEmails: AurinkoEmail[] = data.records || [];

    console.log(`📧 Retrieved ${aurinkoEmails.length} emails from Aurinko`);

    // Insert/update emails in database
    let syncedCount = 0;
    for (const email of aurinkoEmails) {
      try {
        await db
          .insert(emails)
          .values({
            accountId: account.id,
            messageId: email.id,
            threadId: email.threadId || email.id,
            subject: email.subject || '(No Subject)',
            fromAddress: email.from,
            toAddresses: email.to || [],
            ccAddresses: email.cc || [],
            bccAddresses: email.bcc || [],
            replyTo: email.replyTo?.[0]?.email,
            snippet: email.bodyPreview || '',
            bodyText: email.body || '',
            bodyHtml: email.bodyHtml || email.body || '',
            receivedAt: new Date(email.receivedDateTime || email.date),
            sentAt: new Date(email.date),
            hasAttachments: email.hasAttachments || false,
            isRead: email.isRead,
            isStarred: email.isFlagged || false,
            isDraft: email.isDraft || false,
            folderName: 'inbox', // Will be updated based on folder mapping
            emailCategory: 'inbox', // Default category
          })
          .onConflictDoUpdate({
            target: [emails.messageId, emails.accountId],
            set: {
              isRead: email.isRead,
              isStarred: email.isFlagged || false,
              updatedAt: new Date(),
            },
          });

        syncedCount++;
      } catch (error) {
        console.error(`⚠️ Failed to sync email ${email.id}:`, error);
        // Continue with other emails
      }
    }

    // Update account last sync time
    await db
      .update(emailAccounts)
      .set({
        lastSyncAt: new Date(),
        lastSyncedAt: new Date(),
        status: 'active',
      })
      .where(eq(emailAccounts.id, accountId));

    console.log(`✅ Synced ${syncedCount} emails from Aurinko`);

    return { success: true, emailCount: syncedCount };
  } catch (error) {
    console.error('❌ Error syncing Aurinko emails:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sync folders from Aurinko
 */
async function syncAurinkoFolders(
  accountId: string,
  accessToken: string
): Promise<void> {
  try {
    console.log('🔵 Syncing folders from Aurinko...');

    const response = await fetch('https://api.aurinko.io/v1/email/folders', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch Aurinko folders');
      return;
    }

    const data = await response.json();
    const aurinkoFolders: AurinkoFolder[] = data.records || [];

    console.log(`📁 Retrieved ${aurinkoFolders.length} folders from Aurinko`);

    // Insert/update folders in database
    for (const folder of aurinkoFolders) {
      try {
        await db
          .insert(emailFolders)
          .values({
            accountId,
            folderId: folder.id,
            name: folder.name,
            folderType: mapAurinkoFolderType(folder.type),
            unreadCount: folder.unreadCount || 0,
            totalCount: folder.totalCount || 0,
            syncEnabled: shouldSyncFolder(folder.type),
          })
          .onConflictDoUpdate({
            target: [emailFolders.folderId, emailFolders.accountId],
            set: {
              unreadCount: folder.unreadCount || 0,
              totalCount: folder.totalCount || 0,
              updatedAt: new Date(),
            },
          });
      } catch (error) {
        console.error(`⚠️ Failed to sync folder ${folder.name}:`, error);
      }
    }

    console.log('✅ Folders synced successfully');
  } catch (error) {
    console.error('❌ Error syncing Aurinko folders:', error);
  }
}

/**
 * Map Aurinko folder types to our CoreFolderType enum
 */
function mapAurinkoFolderType(
  aurinkoType: string
): 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'archive' | 'custom' {
  const typeMap: Record<string, any> = {
    Inbox: 'inbox',
    Sent: 'sent',
    Drafts: 'drafts',
    Trash: 'trash',
    Junk: 'spam',
    Spam: 'spam',
    Archive: 'archive',
  };

  return typeMap[aurinkoType] || 'custom';
}

/**
 * Determine if folder should be synced by default
 */
function shouldSyncFolder(folderType: string): boolean {
  const noSyncTypes = ['Trash', 'Spam', 'Junk'];
  return !noSyncTypes.includes(folderType);
}

/**
 * Refresh Aurinko access token
 */
async function refreshAurinkoToken(accountId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log(`🔄 Refreshing Aurinko token for account: ${accountId}`);

    const account = await db.query.emailAccounts.findFirst({
      where: eq(emailAccounts.id, accountId),
    });

    if (!account || !account.aurinkoRefreshToken) {
      return { success: false, error: 'No refresh token available' };
    }

    const response = await fetch('https://api.aurinko.io/v1/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: account.aurinkoRefreshToken,
        clientId: process.env.AURINKO_CLIENT_ID,
        clientSecret: process.env.AURINKO_CLIENT_SECRET,
        grantType: 'refresh_token',
      }),
    });

    if (!response.ok) {
      return { success: false, error: 'Token refresh failed' };
    }

    const tokens = await response.json();

    // Update account with new tokens
    await db
      .update(emailAccounts)
      .set({
        aurinkoAccessToken: tokens.accessToken,
        aurinkoRefreshToken: tokens.refreshToken || account.aurinkoRefreshToken,
        aurinkoTokenExpiresAt: tokens.expiresIn
          ? new Date(Date.now() + tokens.expiresIn * 1000)
          : null,
        updatedAt: new Date(),
      })
      .where(eq(emailAccounts.id, accountId));

    console.log('✅ Aurinko token refreshed successfully');

    return { success: true };
  } catch (error) {
    console.error('❌ Error refreshing Aurinko token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get Aurinko account status
 */
export async function getAurinkoAccountStatus(accountId: string): Promise<{
  success: boolean;
  status?: string;
  email?: string;
  provider?: string;
  lastSync?: Date;
  error?: string;
}> {
  try {
    const account = await db.query.emailAccounts.findFirst({
      where: eq(emailAccounts.id, accountId),
    });

    if (!account || !account.useAurinko) {
      return { success: false, error: 'Not an Aurinko account' };
    }

    return {
      success: true,
      status: account.status,
      email: account.emailAddress,
      provider: account.aurinkoProvider || undefined,
      lastSync: account.lastSyncAt || undefined,
    };
  } catch (error) {
    console.error('❌ Error getting Aurinko account status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
