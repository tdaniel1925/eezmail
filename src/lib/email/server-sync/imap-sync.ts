/**
 * IMAP Server Sync Operations
 * Syncs email actions back to IMAP servers
 */

import { ImapService } from '../imap-service';

export interface ImapSyncResult {
  success: boolean;
  error?: string;
}

export interface ImapConfig {
  user: string;
  password: string;
  host: string;
  port: number;
  tls: boolean;
}

/**
 * Delete email on IMAP server
 */
export async function deleteImapEmail(
  config: ImapConfig,
  messageId: string
): Promise<ImapSyncResult> {
  try {
    const imap = new ImapService(config);
    await imap.deleteMessage(messageId);

    console.log(`✅ Deleted message ${messageId} from IMAP server`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting from IMAP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Mark email as read/unread on IMAP server
 */
export async function updateImapEmailReadStatus(
  config: ImapConfig,
  messageId: string,
  isRead: boolean
): Promise<ImapSyncResult> {
  try {
    const imap = new ImapService(config);
    await imap.markAsRead([messageId], isRead);

    console.log(
      `✅ Updated message ${messageId} read status to ${isRead} on IMAP server`
    );
    return { success: true };
  } catch (error) {
    console.error('Error updating read status on IMAP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Move email to folder on IMAP server
 */
export async function moveImapEmail(
  config: ImapConfig,
  messageId: string,
  targetFolder: string
): Promise<ImapSyncResult> {
  try {
    const imap = new ImapService(config);
    await imap.moveMessage(messageId, targetFolder);

    console.log(
      `✅ Moved message ${messageId} to folder ${targetFolder} on IMAP server`
    );
    return { success: true };
  } catch (error) {
    console.error('Error moving email on IMAP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Archive email on IMAP server (move to Archive folder)
 */
export async function archiveImapEmail(
  config: ImapConfig,
  messageId: string
): Promise<ImapSyncResult> {
  try {
    // Try common archive folder names
    const archiveFolderNames = ['Archive', 'Archives', 'Archived'];

    for (const folderName of archiveFolderNames) {
      try {
        await moveImapEmail(config, messageId, folderName);
        return { success: true };
      } catch (error) {
        // Try next folder name
        continue;
      }
    }

    // If no archive folder found, just mark as read
    console.warn('Archive folder not found, marking as read instead');
    return await updateImapEmailReadStatus(config, messageId, true);
  } catch (error) {
    console.error('Error archiving email on IMAP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}


