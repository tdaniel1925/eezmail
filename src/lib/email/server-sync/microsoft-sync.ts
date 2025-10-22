/**
 * Microsoft Graph Server Sync Operations
 * Syncs email actions back to Microsoft email servers
 */

export interface MicrosoftSyncResult {
  success: boolean;
  error?: string;
}

/**
 * Delete email on Microsoft server
 */
export async function deleteMicrosoftEmail(
  accessToken: string,
  messageId: string
): Promise<MicrosoftSyncResult> {
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages/${messageId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Microsoft delete failed:', response.status, errorText);
      return {
        success: false,
        error: `Microsoft API error: ${response.status}`,
      };
    }

    console.log(`✅ Deleted message ${messageId} from Microsoft server`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting from Microsoft:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Mark email as read/unread on Microsoft server
 */
export async function updateMicrosoftEmailReadStatus(
  accessToken: string,
  messageId: string,
  isRead: boolean
): Promise<MicrosoftSyncResult> {
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages/${messageId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isRead,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        'Microsoft update read status failed:',
        response.status,
        errorText
      );
      return {
        success: false,
        error: `Microsoft API error: ${response.status}`,
      };
    }

    console.log(
      `✅ Updated message ${messageId} read status to ${isRead} on Microsoft server`
    );
    return { success: true };
  } catch (error) {
    console.error('Error updating read status on Microsoft:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Move email to folder on Microsoft server
 */
export async function moveMicrosoftEmail(
  accessToken: string,
  messageId: string,
  destinationFolderId: string
): Promise<MicrosoftSyncResult> {
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages/${messageId}/move`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destinationId: destinationFolderId,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Microsoft move failed:', response.status, errorText);
      return {
        success: false,
        error: `Microsoft API error: ${response.status}`,
      };
    }

    console.log(
      `✅ Moved message ${messageId} to folder ${destinationFolderId} on Microsoft server`
    );
    return { success: true };
  } catch (error) {
    console.error('Error moving email on Microsoft:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Archive email on Microsoft server (move to Archive folder)
 */
export async function archiveMicrosoftEmail(
  accessToken: string,
  messageId: string
): Promise<MicrosoftSyncResult> {
  try {
    // First, get the Archive folder ID
    const foldersResponse = await fetch(
      'https://graph.microsoft.com/v1.0/me/mailFolders',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!foldersResponse.ok) {
      return {
        success: false,
        error: 'Failed to get folders',
      };
    }

    const foldersData = await foldersResponse.json();
    const archiveFolder = foldersData.value.find(
      (folder: any) =>
        folder.displayName.toLowerCase() === 'archive' ||
        folder.displayName.toLowerCase() === 'archived'
    );

    if (!archiveFolder) {
      console.warn('Archive folder not found on Microsoft server');
      return {
        success: false,
        error: 'Archive folder not found',
      };
    }

    // Move to archive folder
    return await moveMicrosoftEmail(accessToken, messageId, archiveFolder.id);
  } catch (error) {
    console.error('Error archiving email on Microsoft:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}


