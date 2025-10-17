'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails, contacts, emailAccounts, customFolders } from '@/db/schema';
import { eq, inArray, and, or, like, sql } from 'drizzle-orm';
import { recordAction } from './undo';

/**
 * Create a contact from email information
 */
export async function createContact(params: {
  firstName: string;
  lastName: string;
  email: string;
}): Promise<{ success: boolean; contactId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const contact = await db
      .insert(contacts)
      .values({
        userId: user.id,
        firstName: params.firstName,
        lastName: params.lastName,
        displayName: `${params.firstName} ${params.lastName}`,
      } as any)
      .returning();

    return { success: true, contactId: contact[0].id };
  } catch (error) {
    console.error('Error creating contact:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create contact',
    };
  }
}

/**
 * Bulk categorize emails
 */
export async function bulkCategorizeEmails(params: {
  emailIds: string[];
  category: 'inbox' | 'newsfeed' | 'receipts' | 'spam' | 'archived';
}): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update emails
    await db
      .update(emails)
      .set({
        emailCategory: params.category,
        folderName: params.category,
      } as any)
      .where(inArray(emails.id, params.emailIds));

    return { success: true, count: params.emailIds.length };
  } catch (error) {
    console.error('Error bulk categorizing emails:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to categorize emails',
    };
  }
}

/**
 * Send an email
 */
export async function sendEmailAction(params: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  accountId?: string;
  attachments?: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    data: string; // Base64
  }>;
  isHtml?: boolean;
  scheduledFor?: Date;
  draftId?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user's first active email account
    let account;
    if (params.accountId) {
      account = await db.query.emailAccounts.findFirst({
        where: eq(emailAccounts.id, params.accountId),
      });
    } else {
      const accounts = await db.query.emailAccounts.findMany({
        where: eq(emailAccounts.userId, user.id),
      });
      account = accounts.find((a) => a.status === 'active');
    }

    if (!account) {
      return { success: false, error: 'No active email account found' };
    }

    // TODO: Implement actual email sending via provider (Nylas/Gmail/Microsoft)
    // For now, log the email details
    console.log('Sending email:', {
      from: account.emailAddress,
      to: params.to,
      cc: params.cc,
      bcc: params.bcc,
      subject: params.subject,
      body: params.body,
      isHtml: params.isHtml ?? true,
      attachmentCount: params.attachments?.length || 0,
      scheduledFor: params.scheduledFor,
    });

    // If scheduled, store in scheduledEmails table (to be implemented)
    if (params.scheduledFor) {
      // TODO: Store in scheduledEmails table
      console.log('Email scheduled for:', params.scheduledFor);
    }

    // If there's a draft, delete it after sending
    if (params.draftId) {
      // TODO: Delete draft from emailDrafts table
      console.log('Deleting draft:', params.draftId);
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Mark emails as read/unread
 */
export async function updateEmailReadStatus(params: {
  emailIds: string[];
  isRead: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    await db
      .update(emails)
      .set({ isRead: params.isRead } as any)
      .where(inArray(emails.id, params.emailIds));

    return { success: true };
  } catch (error) {
    console.error('Error updating email status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update emails',
    };
  }
}

/**
 * Star/unstar emails
 */
export async function toggleEmailStar(params: {
  emailId: string;
  isStarred: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    await db
      .update(emails)
      .set({ isStarred: params.isStarred } as any)
      .where(eq(emails.id, params.emailId));

    return { success: true };
  } catch (error) {
    console.error('Error toggling star:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update email',
    };
  }
}

// ============================================================================
// BULK ACTIONS FOR CHATBOT
// ============================================================================

/**
 * Search emails by sender address
 */
async function findEmailsBySender(
  userId: string,
  senderEmail: string
): Promise<any[]> {
  const userAccounts = await db.query.emailAccounts.findMany({
    where: eq(emailAccounts.userId, userId),
  });

  const accountIds = userAccounts.map((a) => a.id);

  if (accountIds.length === 0) return [];

  const results = await db.query.emails.findMany({
    where: and(
      inArray(emails.accountId, accountIds),
      or(like(emails.fromAddress as any, `%${senderEmail}%`))
    ),
    limit: 500,
  });

  return results;
}

/**
 * Bulk move emails by sender to a folder (accepts folder name, creates if needed)
 */
export async function bulkMoveEmailsBySenderWithFolderName(params: {
  userId: string;
  senderEmail: string;
  folderName: string;
  createFolder?: boolean;
}): Promise<{
  success: boolean;
  count: number;
  folderId?: string;
  message: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, count: 0, message: 'Unauthorized' };
    }

    // Find existing folder (case-insensitive)
    const existingFolder = await db.query.customFolders.findFirst({
      where: and(
        eq(customFolders.userId, params.userId),
        sql`LOWER(${customFolders.name}) = LOWER(${params.folderName})`
      ),
    });

    let folderId: string;

    if (existingFolder) {
      folderId = existingFolder.id;
    } else if (params.createFolder !== false) {
      // Create new folder
      const newFolder = await db
        .insert(customFolders)
        .values({
          userId: params.userId,
          name: params.folderName,
          icon: '📁',
          color: 'blue',
        } as any)
        .returning();

      folderId = newFolder[0].id;

      // Record folder creation for undo
      await recordAction(
        params.userId,
        'create_folder',
        `Created folder "${params.folderName}"`,
        {
          folderId,
          folderName: params.folderName,
        }
      );
    } else {
      return {
        success: false,
        count: 0,
        message: `Folder "${params.folderName}" does not exist`,
      };
    }

    // Now call the existing bulk move function
    const result = await bulkMoveEmailsBySender({
      userId: params.userId,
      senderEmail: params.senderEmail,
      folderId,
    });

    return {
      ...result,
      folderId,
    };
  } catch (error) {
    console.error('Error in bulkMoveEmailsBySenderWithFolderName:', error);
    return { success: false, count: 0, message: 'Failed to move emails' };
  }
}

/**
 * Bulk move emails by sender to a folder (requires folderId)
 */
export async function bulkMoveEmailsBySender(params: {
  userId: string;
  senderEmail: string;
  folderId: string;
}): Promise<{ success: boolean; count: number; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, count: 0, message: 'Unauthorized' };
    }

    // Find all emails from sender
    const foundEmails = await findEmailsBySender(
      params.userId,
      params.senderEmail
    );

    if (foundEmails.length === 0) {
      return {
        success: false,
        count: 0,
        message: `No emails found from ${params.senderEmail}`,
      };
    }

    const emailIds = foundEmails.map((e) => e.id);
    const originalFolder = foundEmails[0]?.customFolderId || null;

    // Move emails
    await db
      .update(emails)
      .set({ customFolderId: params.folderId, updatedAt: new Date() } as any)
      .where(inArray(emails.id, emailIds));

    // Record action for undo
    await recordAction(
      params.userId,
      'bulk_move',
      `Moved ${foundEmails.length} emails from ${params.senderEmail}`,
      {
        emailIds,
        originalFolder,
        targetFolder: params.folderId,
      }
    );

    return {
      success: true,
      count: foundEmails.length,
      message: `Moved ${foundEmails.length} emails from ${params.senderEmail}`,
    };
  } catch (error) {
    console.error('Error in bulkMoveEmailsBySender:', error);
    return { success: false, count: 0, message: 'Failed to move emails' };
  }
}

/**
 * Bulk move specific emails to a folder
 */
export async function bulkMoveEmailsToFolder(params: {
  userId: string;
  emailIds: string[];
  folderId: string;
}): Promise<{ success: boolean; count: number; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, count: 0, message: 'Unauthorized' };
    }

    if (params.emailIds.length === 0) {
      return { success: false, count: 0, message: 'No emails specified' };
    }

    // Get original folder for first email (for undo)
    const firstEmail = await db.query.emails.findFirst({
      where: eq(emails.id, params.emailIds[0]),
    });

    const originalFolder = firstEmail?.customFolderId || null;

    // Move emails
    await db
      .update(emails)
      .set({ customFolderId: params.folderId, updatedAt: new Date() } as any)
      .where(inArray(emails.id, params.emailIds));

    // Record action for undo
    await recordAction(
      params.userId,
      'bulk_move',
      `Moved ${params.emailIds.length} emails to folder`,
      {
        emailIds: params.emailIds,
        originalFolder,
        targetFolder: params.folderId,
      }
    );

    return {
      success: true,
      count: params.emailIds.length,
      message: `Moved ${params.emailIds.length} emails`,
    };
  } catch (error) {
    console.error('Error in bulkMoveEmailsToFolder:', error);
    return { success: false, count: 0, message: 'Failed to move emails' };
  }
}

/**
 * Create folder and move emails in one action
 */
export async function createFolderAndMoveEmails(params: {
  userId: string;
  folderName: string;
  senderEmail?: string;
  emailIds?: string[];
}): Promise<{
  success: boolean;
  folderId?: string;
  count: number;
  message: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, count: 0, message: 'Unauthorized' };
    }

    // Check if folder already exists
    const existing = await db.query.customFolders.findFirst({
      where: and(
        eq(customFolders.userId, params.userId),
        eq(customFolders.name, params.folderName)
      ),
    });

    let folderId: string;
    let folderCreated = false;

    if (existing) {
      folderId = existing.id;
    } else {
      // Create folder
      const [newFolder] = await db
        .insert(customFolders)
        .values({
          userId: params.userId,
          name: params.folderName,
          icon: '📁',
          color: 'blue',
          sortOrder: 0,
        } as any)
        .returning();

      folderId = newFolder.id;
      folderCreated = true;

      // Record folder creation for undo
      await recordAction(
        params.userId,
        'create_folder',
        `Created folder "${params.folderName}"`,
        {
          folderId,
          folderName: params.folderName,
        }
      );
    }

    // Move emails
    let emailIds: string[];

    if (params.senderEmail) {
      const foundEmails = await findEmailsBySender(
        params.userId,
        params.senderEmail
      );
      emailIds = foundEmails.map((e) => e.id);
    } else if (params.emailIds) {
      emailIds = params.emailIds;
    } else {
      return {
        success: false,
        count: 0,
        message: 'No emails specified to move',
      };
    }

    if (emailIds.length > 0) {
      await db
        .update(emails)
        .set({ customFolderId: folderId, updatedAt: new Date() } as any)
        .where(inArray(emails.id, emailIds));

      // Record move action for undo
      await recordAction(
        params.userId,
        'bulk_move',
        `Moved ${emailIds.length} emails to "${params.folderName}"`,
        {
          emailIds,
          originalFolder: null,
          targetFolder: folderId,
        }
      );
    }

    return {
      success: true,
      folderId,
      count: emailIds.length,
      message: folderCreated
        ? `Created folder "${params.folderName}" and moved ${emailIds.length} emails`
        : `Moved ${emailIds.length} emails to existing folder "${params.folderName}"`,
    };
  } catch (error) {
    console.error('Error in createFolderAndMoveEmails:', error);
    return {
      success: false,
      count: 0,
      message: 'Failed to create folder and move emails',
    };
  }
}

/**
 * Bulk archive emails
 */
export async function bulkArchiveEmails(params: {
  userId: string;
  emailIds: string[];
}): Promise<{ success: boolean; count: number; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, count: 0, message: 'Unauthorized' };
    }

    if (params.emailIds.length === 0) {
      return { success: false, count: 0, message: 'No emails specified' };
    }

    await db
      .update(emails)
      .set({ emailCategory: 'archived', updatedAt: new Date() } as any)
      .where(inArray(emails.id, params.emailIds));

    // Record action for undo
    await recordAction(
      params.userId,
      'bulk_archive',
      `Archived ${params.emailIds.length} emails`,
      {
        emailIds: params.emailIds,
      }
    );

    return {
      success: true,
      count: params.emailIds.length,
      message: `Archived ${params.emailIds.length} emails`,
    };
  } catch (error) {
    console.error('Error in bulkArchiveEmails:', error);
    return { success: false, count: 0, message: 'Failed to archive emails' };
  }
}

/**
 * Bulk delete emails (soft delete - moves to trash/spam)
 */
export async function bulkDeleteEmails(params: {
  userId: string;
  emailIds: string[];
  permanent?: boolean;
}): Promise<{ success: boolean; count: number; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, count: 0, message: 'Unauthorized' };
    }

    if (params.emailIds.length === 0) {
      return { success: false, count: 0, message: 'No emails specified' };
    }

    if (params.permanent) {
      // Permanent delete - no undo possible
      await db.delete(emails).where(inArray(emails.id, params.emailIds));

      return {
        success: true,
        count: params.emailIds.length,
        message: `Permanently deleted ${params.emailIds.length} emails`,
      };
    } else {
      // Soft delete - move to spam category
      await db
        .update(emails)
        .set({ emailCategory: 'spam', updatedAt: new Date() } as any)
        .where(inArray(emails.id, params.emailIds));

      // Record action for undo
      await recordAction(
        params.userId,
        'bulk_delete',
        `Deleted ${params.emailIds.length} emails`,
        {
          emailIds: params.emailIds,
        }
      );

      return {
        success: true,
        count: params.emailIds.length,
        message: `Deleted ${params.emailIds.length} emails`,
      };
    }
  } catch (error) {
    console.error('Error in bulkDeleteEmails:', error);
    return { success: false, count: 0, message: 'Failed to delete emails' };
  }
}

/**
 * Bulk mark emails as read/unread
 */
export async function bulkMarkAsRead(params: {
  userId: string;
  emailIds: string[];
  isRead: boolean;
}): Promise<{ success: boolean; count: number; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, count: 0, message: 'Unauthorized' };
    }

    if (params.emailIds.length === 0) {
      return { success: false, count: 0, message: 'No emails specified' };
    }

    // Get original read states for undo
    const originalEmails = await db.query.emails.findMany({
      where: inArray(emails.id, params.emailIds),
    });

    const originalReadStates: Record<string, boolean> = {};
    originalEmails.forEach((email) => {
      originalReadStates[email.id] = email.isRead;
    });

    await db
      .update(emails)
      .set({ isRead: params.isRead, updatedAt: new Date() } as any)
      .where(inArray(emails.id, params.emailIds));

    // Record action for undo
    await recordAction(
      params.userId,
      'bulk_mark_read',
      `Marked ${params.emailIds.length} emails as ${params.isRead ? 'read' : 'unread'}`,
      {
        emailIds: params.emailIds,
        originalReadStates,
      }
    );

    return {
      success: true,
      count: params.emailIds.length,
      message: `Marked ${params.emailIds.length} emails as ${params.isRead ? 'read' : 'unread'}`,
    };
  } catch (error) {
    console.error('Error in bulkMarkAsRead:', error);
    return { success: false, count: 0, message: 'Failed to update emails' };
  }
}

/**
 * Bulk star/unstar emails
 */
export async function bulkStarEmails(params: {
  userId: string;
  emailIds: string[];
  isStarred: boolean;
}): Promise<{ success: boolean; count: number; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, count: 0, message: 'Unauthorized' };
    }

    if (params.emailIds.length === 0) {
      return { success: false, count: 0, message: 'No emails specified' };
    }

    // Get original star states for undo
    const originalEmails = await db.query.emails.findMany({
      where: inArray(emails.id, params.emailIds),
    });

    const originalStarStates: Record<string, boolean> = {};
    originalEmails.forEach((email) => {
      originalStarStates[email.id] = email.isStarred;
    });

    await db
      .update(emails)
      .set({ isStarred: params.isStarred, updatedAt: new Date() } as any)
      .where(inArray(emails.id, params.emailIds));

    // Record action for undo
    await recordAction(
      params.userId,
      'bulk_star',
      `${params.isStarred ? 'Starred' : 'Unstarred'} ${params.emailIds.length} emails`,
      {
        emailIds: params.emailIds,
        originalStarStates,
      }
    );

    return {
      success: true,
      count: params.emailIds.length,
      message: `${params.isStarred ? 'Starred' : 'Unstarred'} ${params.emailIds.length} emails`,
    };
  } catch (error) {
    console.error('Error in bulkStarEmails:', error);
    return { success: false, count: 0, message: 'Failed to update emails' };
  }
}
