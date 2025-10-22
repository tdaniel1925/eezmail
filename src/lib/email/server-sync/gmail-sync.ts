/**
 * Gmail API Server Sync Operations
 * Syncs email actions back to Gmail servers
 */

export interface GmailSyncResult {
  success: boolean;
  error?: string;
}

/**
 * Delete email on Gmail server (move to trash)
 */
export async function deleteGmailEmail(
  accessToken: string,
  messageId: string,
  permanent: boolean = false
): Promise<GmailSyncResult> {
  try {
    if (permanent) {
      // Permanent delete
      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gmail delete failed:', response.status, errorText);
        return {
          success: false,
          error: `Gmail API error: ${response.status}`,
        };
      }

      console.log(`✅ Permanently deleted message ${messageId} from Gmail`);
    } else {
      // Move to trash
      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gmail trash failed:', response.status, errorText);
        return {
          success: false,
          error: `Gmail API error: ${response.status}`,
        };
      }

      console.log(`✅ Moved message ${messageId} to trash on Gmail`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting from Gmail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Mark email as read/unread on Gmail server
 */
export async function updateGmailEmailReadStatus(
  accessToken: string,
  messageId: string,
  isRead: boolean
): Promise<GmailSyncResult> {
  try {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addLabelIds: isRead ? [] : ['UNREAD'],
          removeLabelIds: isRead ? ['UNREAD'] : [],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        'Gmail update read status failed:',
        response.status,
        errorText
      );
      return {
        success: false,
        error: `Gmail API error: ${response.status}`,
      };
    }

    console.log(
      `✅ Updated message ${messageId} read status to ${isRead} on Gmail`
    );
    return { success: true };
  } catch (error) {
    console.error('Error updating read status on Gmail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Move email by modifying labels on Gmail server
 */
export async function moveGmailEmail(
  accessToken: string,
  messageId: string,
  targetLabel: string
): Promise<GmailSyncResult> {
  try {
    // Map folder names to Gmail labels
    const labelMap: Record<string, string> = {
      inbox: 'INBOX',
      sent: 'SENT',
      drafts: 'DRAFT',
      trash: 'TRASH',
      spam: 'SPAM',
      archive: 'ARCHIVE', // Note: Archive removes INBOX label
    };

    const labelId = labelMap[targetLabel.toLowerCase()] || targetLabel;

    // For archive, remove INBOX label
    if (targetLabel.toLowerCase() === 'archive') {
      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            removeLabelIds: ['INBOX'],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gmail archive failed:', response.status, errorText);
        return {
          success: false,
          error: `Gmail API error: ${response.status}`,
        };
      }

      console.log(`✅ Archived message ${messageId} on Gmail`);
      return { success: true };
    }

    // For other folders, add the label
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addLabelIds: [labelId],
          removeLabelIds: ['INBOX'], // Remove from inbox when moving
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gmail move failed:', response.status, errorText);
      return {
        success: false,
        error: `Gmail API error: ${response.status}`,
      };
    }

    console.log(`✅ Moved message ${messageId} to ${targetLabel} on Gmail`);
    return { success: true };
  } catch (error) {
    console.error('Error moving email on Gmail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Archive email on Gmail server
 */
export async function archiveGmailEmail(
  accessToken: string,
  messageId: string
): Promise<GmailSyncResult> {
  return moveGmailEmail(accessToken, messageId, 'archive');
}

/**
 * Star/unstar email on Gmail server
 */
export async function starGmailEmail(
  accessToken: string,
  messageId: string,
  isStarred: boolean
): Promise<GmailSyncResult> {
  try {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addLabelIds: isStarred ? ['STARRED'] : [],
          removeLabelIds: isStarred ? [] : ['STARRED'],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gmail star failed:', response.status, errorText);
      return {
        success: false,
        error: `Gmail API error: ${response.status}`,
      };
    }

    console.log(
      `✅ ${isStarred ? 'Starred' : 'Unstarred'} message ${messageId} on Gmail`
    );
    return { success: true };
  } catch (error) {
    console.error('Error starring email on Gmail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}


