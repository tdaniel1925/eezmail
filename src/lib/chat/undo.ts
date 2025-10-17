import { db } from '@/lib/db';
import { chatbotActions, emails, customFolders, emailRules } from '@/db/schema';
import { eq, and, lt, inArray } from 'drizzle-orm';

interface UndoData {
  actionType: string;
  originalValues?: any;
  affectedIds?: string[];
  description: string;
}

/**
 * Record an action for potential undo
 */
export async function recordAction(
  userId: string,
  actionType: string,
  description: string,
  undoData: any
): Promise<string> {
  try {
    // Set expiry to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const [action] = await db
      .insert(chatbotActions)
      .values({
        userId,
        actionType,
        description,
        undoData,
        isUndone: false,
        expiresAt,
      } as any)
      .returning();

    return action.id;
  } catch (error) {
    console.error('Error recording action:', error);
    throw error;
  }
}

/**
 * Undo a bulk email move
 */
async function undoBulkMove(userId: string, undoData: any): Promise<void> {
  const { emailIds, originalFolders } = undoData;

  // Restore each email to its original folder
  for (let i = 0; i < emailIds.length; i++) {
    const emailId = emailIds[i];
    const originalFolder = originalFolders[i];

    await db
      .update(emails)
      .set({ folder: originalFolder })
      .where(and(eq(emails.id, emailId), eq(emails.userId, userId)));
  }
}

/**
 * Undo bulk archive
 */
async function undoBulkArchive(userId: string, undoData: any): Promise<void> {
  const { emailIds, originalFolders } = undoData;

  // Restore each email to its original folder
  for (let i = 0; i < emailIds.length; i++) {
    const emailId = emailIds[i];
    const originalFolder = originalFolders[i];

    await db
      .update(emails)
      .set({ folder: originalFolder })
      .where(and(eq(emails.id, emailId), eq(emails.userId, userId)));
  }
}

/**
 * Undo bulk delete (restore from trash)
 */
async function undoBulkDelete(userId: string, undoData: any): Promise<void> {
  const { emailIds, originalFolders } = undoData;

  // Restore each email to its original folder
  for (let i = 0; i < emailIds.length; i++) {
    const emailId = emailIds[i];
    const originalFolder = originalFolders[i];

    await db
      .update(emails)
      .set({ folder: originalFolder, isDeleted: false })
      .where(and(eq(emails.id, emailId), eq(emails.userId, userId)));
  }
}

/**
 * Undo mark as read
 */
async function undoBulkMarkRead(userId: string, undoData: any): Promise<void> {
  const { emailIds, originalReadStates } = undoData;

  // Restore each email's original read state
  for (let i = 0; i < emailIds.length; i++) {
    const emailId = emailIds[i];
    const wasRead = originalReadStates[i];

    await db
      .update(emails)
      .set({ isRead: wasRead })
      .where(and(eq(emails.id, emailId), eq(emails.userId, userId)));
  }
}

/**
 * Undo star/unstar
 */
async function undoBulkStar(userId: string, undoData: any): Promise<void> {
  const { emailIds, originalStarStates } = undoData;

  // Restore each email's original star state
  for (let i = 0; i < emailIds.length; i++) {
    const emailId = emailIds[i];
    const wasStarred = originalStarStates[i];

    await db
      .update(emails)
      .set({ isStarred: wasStarred })
      .where(and(eq(emails.id, emailId), eq(emails.userId, userId)));
  }
}

/**
 * Undo folder creation
 */
async function undoCreateFolder(userId: string, undoData: any): Promise<void> {
  const { folderId } = undoData;

  // Delete the folder
  await db
    .delete(customFolders)
    .where(
      and(eq(customFolders.id, folderId), eq(customFolders.userId, userId))
    );
}

/**
 * Undo folder deletion (restore)
 */
async function undoDeleteFolder(userId: string, undoData: any): Promise<void> {
  const { folderData } = undoData;

  // Recreate the folder with same ID if possible
  await db.insert(customFolders).values(folderData);
}

/**
 * Undo rule creation
 */
async function undoCreateRule(userId: string, undoData: any): Promise<void> {
  const { ruleId } = undoData;

  // Delete the rule
  await db
    .delete(emailRules)
    .where(and(eq(emailRules.id, ruleId), eq(emailRules.userId, userId)));
}

/**
 * Undo rule deletion (restore)
 */
async function undoDeleteRule(userId: string, undoData: any): Promise<void> {
  const { ruleData } = undoData;

  // Recreate the rule
  await db.insert(emailRules).values(ruleData);
}

/**
 * Undo rule update
 */
async function undoUpdateRule(userId: string, undoData: any): Promise<void> {
  const { ruleId, originalData } = undoData;

  // Restore original rule data
  await db
    .update(emailRules)
    .set(originalData)
    .where(and(eq(emailRules.id, ruleId), eq(emailRules.userId, userId)));
}

/**
 * Main undo function - dispatches to specific undo handlers
 */
export async function undoAction(
  userId: string,
  actionId: string
): Promise<any> {
  try {
    // Get the action
    const [action] = await db
      .select()
      .from(chatbotActions)
      .where(
        and(eq(chatbotActions.id, actionId), eq(chatbotActions.userId, userId))
      )
      .limit(1);

    if (!action) {
      throw new Error('Action not found');
    }

    if (action.isUndone) {
      throw new Error('Action has already been undone');
    }

    // Check if action has expired
    if (action.expiresAt && action.expiresAt < new Date()) {
      throw new Error('Action has expired and cannot be undone');
    }

    // Dispatch to appropriate undo handler based on action type
    switch (action.actionType) {
      case 'bulk_move':
        await undoBulkMove(userId, action.undoData);
        break;

      case 'bulk_archive':
        await undoBulkArchive(userId, action.undoData);
        break;

      case 'bulk_delete':
        await undoBulkDelete(userId, action.undoData);
        break;

      case 'bulk_mark_read':
        await undoBulkMarkRead(userId, action.undoData);
        break;

      case 'bulk_star':
        await undoBulkStar(userId, action.undoData);
        break;

      case 'create_folder':
        await undoCreateFolder(userId, action.undoData);
        break;

      case 'delete_folder':
        await undoDeleteFolder(userId, action.undoData);
        break;

      case 'create_rule':
        await undoCreateRule(userId, action.undoData);
        break;

      case 'delete_rule':
        await undoDeleteRule(userId, action.undoData);
        break;

      case 'update_rule':
        await undoUpdateRule(userId, action.undoData);
        break;

      default:
        throw new Error(
          `Undo not supported for action type: ${action.actionType}`
        );
    }

    // Mark action as undone
    await db
      .update(chatbotActions)
      .set({ isUndone: true })
      .where(eq(chatbotActions.id, actionId));

    return {
      success: true,
      message: `Undid: ${action.description}`,
      actionType: action.actionType,
    };
  } catch (error) {
    console.error('Error undoing action:', error);
    throw error;
  }
}

/**
 * Get recent actions that can be undone
 */
export async function getUndoableActions(
  userId: string,
  limit = 10
): Promise<any[]> {
  try {
    const now = new Date();

    const actions = await db
      .select()
      .from(chatbotActions)
      .where(
        and(
          eq(chatbotActions.userId, userId),
          eq(chatbotActions.isUndone, false),
          lt(now, chatbotActions.expiresAt)
        )
      )
      .orderBy(chatbotActions.createdAt)
      .limit(limit);

    return actions;
  } catch (error) {
    console.error('Error fetching undoable actions:', error);
    throw error;
  }
}

/**
 * Clean up expired actions (run periodically)
 */
export async function cleanupExpiredActions(): Promise<number> {
  try {
    const now = new Date();

    const deleted = await db
      .delete(chatbotActions)
      .where(lt(chatbotActions.expiresAt, now))
      .returning();

    return deleted.length;
  } catch (error) {
    console.error('Error cleaning up expired actions:', error);
    throw error;
  }
}
