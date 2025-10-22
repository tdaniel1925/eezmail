/**
 * Unified Server Sync Interface
 * Routes email actions to the appropriate provider (Microsoft, Gmail, IMAP)
 */

import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { TokenManager } from '../token-manager';
import {
  deleteMicrosoftEmail,
  updateMicrosoftEmailReadStatus,
  moveMicrosoftEmail,
  archiveMicrosoftEmail,
} from './microsoft-sync';
import {
  deleteGmailEmail,
  updateGmailEmailReadStatus,
  moveGmailEmail,
  archiveGmailEmail,
  starGmailEmail,
} from './gmail-sync';
import {
  deleteImapEmail,
  updateImapEmailReadStatus,
  moveImapEmail,
  archiveImapEmail,
} from './imap-sync';

export interface ServerSyncResult {
  success: boolean;
  error?: string;
}

/**
 * Delete email on server
 */
export async function serverDeleteEmail(
  accountId: string,
  messageId: string,
  permanent: boolean = false
): Promise<ServerSyncResult> {
  try {
    const account = await db.query.emailAccounts.findFirst({
      where: eq(emailAccounts.id, accountId),
    });

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Get valid access token (handles refresh)
    let accessToken = account.accessToken || '';

    if (account.provider !== 'imap') {
      try {
        const tokenResult = await TokenManager.getValidAccessToken(accountId);
        accessToken = tokenResult.accessToken;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return { success: false, error: 'Token refresh failed' };
      }
    }

    // Route to appropriate provider
    switch (account.provider) {
      case 'microsoft':
        return await deleteMicrosoftEmail(accessToken, messageId);

      case 'gmail':
        return await deleteGmailEmail(accessToken, messageId, permanent);

      case 'imap':
      case 'yahoo':
        if (
          !account.imapHost ||
          !account.imapUsername ||
          !account.imapPassword
        ) {
          return { success: false, error: 'IMAP configuration incomplete' };
        }
        return await deleteImapEmail(
          {
            user: account.imapUsername,
            password: account.imapPassword,
            host: account.imapHost,
            port: account.imapPort || 993,
            tls: account.imapUseSsl !== false,
          },
          messageId
        );

      default:
        return {
          success: false,
          error: `Unsupported provider: ${account.provider}`,
        };
    }
  } catch (error) {
    console.error('Error in serverDeleteEmail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update email read status on server
 */
export async function serverUpdateEmailReadStatus(
  accountId: string,
  messageId: string,
  isRead: boolean
): Promise<ServerSyncResult> {
  try {
    const account = await db.query.emailAccounts.findFirst({
      where: eq(emailAccounts.id, accountId),
    });

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Get valid access token (handles refresh)
    let accessToken = account.accessToken || '';

    if (account.provider !== 'imap') {
      try {
        const tokenResult = await TokenManager.getValidAccessToken(accountId);
        accessToken = tokenResult.accessToken;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return { success: false, error: 'Token refresh failed' };
      }
    }

    // Route to appropriate provider
    switch (account.provider) {
      case 'microsoft':
        return await updateMicrosoftEmailReadStatus(
          accessToken,
          messageId,
          isRead
        );

      case 'gmail':
        return await updateGmailEmailReadStatus(accessToken, messageId, isRead);

      case 'imap':
      case 'yahoo':
        if (
          !account.imapHost ||
          !account.imapUsername ||
          !account.imapPassword
        ) {
          return { success: false, error: 'IMAP configuration incomplete' };
        }
        return await updateImapEmailReadStatus(
          {
            user: account.imapUsername,
            password: account.imapPassword,
            host: account.imapHost,
            port: account.imapPort || 993,
            tls: account.imapUseSsl !== false,
          },
          messageId,
          isRead
        );

      default:
        return {
          success: false,
          error: `Unsupported provider: ${account.provider}`,
        };
    }
  } catch (error) {
    console.error('Error in serverUpdateEmailReadStatus:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Move email to folder on server
 */
export async function serverMoveEmail(
  accountId: string,
  messageId: string,
  targetFolder: string
): Promise<ServerSyncResult> {
  try {
    const account = await db.query.emailAccounts.findFirst({
      where: eq(emailAccounts.id, accountId),
    });

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Get valid access token (handles refresh)
    let accessToken = account.accessToken || '';

    if (account.provider !== 'imap') {
      try {
        const tokenResult = await TokenManager.getValidAccessToken(accountId);
        accessToken = tokenResult.accessToken;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return { success: false, error: 'Token refresh failed' };
      }
    }

    // Route to appropriate provider
    switch (account.provider) {
      case 'microsoft':
        // For Microsoft, we'd need to look up the folder ID
        // For now, use archive function if target is "archive"
        if (targetFolder.toLowerCase() === 'archive') {
          return await archiveMicrosoftEmail(accessToken, messageId);
        }
        return { success: false, error: 'Folder lookup not implemented' };

      case 'gmail':
        return await moveGmailEmail(accessToken, messageId, targetFolder);

      case 'imap':
      case 'yahoo':
        if (
          !account.imapHost ||
          !account.imapUsername ||
          !account.imapPassword
        ) {
          return { success: false, error: 'IMAP configuration incomplete' };
        }
        return await moveImapEmail(
          {
            user: account.imapUsername,
            password: account.imapPassword,
            host: account.imapHost,
            port: account.imapPort || 993,
            tls: account.imapUseSsl !== false,
          },
          messageId,
          targetFolder
        );

      default:
        return {
          success: false,
          error: `Unsupported provider: ${account.provider}`,
        };
    }
  } catch (error) {
    console.error('Error in serverMoveEmail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Archive email on server
 */
export async function serverArchiveEmail(
  accountId: string,
  messageId: string
): Promise<ServerSyncResult> {
  try {
    const account = await db.query.emailAccounts.findFirst({
      where: eq(emailAccounts.id, accountId),
    });

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Get valid access token (handles refresh)
    let accessToken = account.accessToken || '';

    if (account.provider !== 'imap') {
      try {
        const tokenResult = await TokenManager.getValidAccessToken(accountId);
        accessToken = tokenResult.accessToken;
      } catch (error) {
        console.error('Token refresh failed:', error);
        return { success: false, error: 'Token refresh failed' };
      }
    }

    // Route to appropriate provider
    switch (account.provider) {
      case 'microsoft':
        return await archiveMicrosoftEmail(accessToken, messageId);

      case 'gmail':
        return await archiveGmailEmail(accessToken, messageId);

      case 'imap':
      case 'yahoo':
        if (
          !account.imapHost ||
          !account.imapUsername ||
          !account.imapPassword
        ) {
          return { success: false, error: 'IMAP configuration incomplete' };
        }
        return await archiveImapEmail(
          {
            user: account.imapUsername,
            password: account.imapPassword,
            host: account.imapHost,
            port: account.imapPort || 993,
            tls: account.imapUseSsl !== false,
          },
          messageId
        );

      default:
        return {
          success: false,
          error: `Unsupported provider: ${account.provider}`,
        };
    }
  } catch (error) {
    console.error('Error in serverArchiveEmail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Star/unstar email on server (Gmail only)
 */
export async function serverStarEmail(
  accountId: string,
  messageId: string,
  isStarred: boolean
): Promise<ServerSyncResult> {
  try {
    const account = await db.query.emailAccounts.findFirst({
      where: eq(emailAccounts.id, accountId),
    });

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    if (account.provider !== 'gmail') {
      // Star is Gmail-specific, other providers don't have this concept
      return { success: true }; // Silently succeed for other providers
    }

    // Get valid access token
    const tokenResult = await TokenManager.getValidAccessToken(accountId);
    const accessToken = tokenResult.accessToken;

    return await starGmailEmail(accessToken, messageId, isStarred);
  } catch (error) {
    console.error('Error in serverStarEmail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}


