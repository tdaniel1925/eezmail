// src/lib/db/transaction-wrapper.ts
import { db } from '@/lib/db';
import { emails, emailAttachments } from '@/db/schema';

/**
 * Execute a function within a database transaction
 * If any operation fails, all changes are rolled back
 */
export async function withTransaction<T>(
  fn: (tx: typeof db) => Promise<T>
): Promise<T> {
  // Drizzle ORM supports transactions natively
  return await db.transaction(async (tx) => {
    return await fn(tx);
  });
}

export interface EmailWithAttachmentsData {
  email: {
    accountId: string;
    messageId: string;
    threadId: string;
    subject: string;
    snippet: string;
    fromAddress: { email: string; name: string };
    toAddresses: Array<{ email: string; name: string }>;
    receivedAt: Date;
    isRead: boolean;
    isStarred: boolean;
    hasAttachments: boolean;
    folderName?: string;
    bodyHtml?: string;
    bodyText?: string;
  };
  attachments?: Array<{
    filename: string;
    mimeType: string;
    size: number;
    url?: string;
    contentId?: string;
    isInline?: boolean;
  }>;
}

/**
 * Insert email and attachments atomically
 * If email insertion fails, attachments won't be inserted
 * If attachment insertion fails, email won't be inserted
 */
export async function insertEmailWithAttachments(
  data: EmailWithAttachmentsData
): Promise<{ emailId: string; attachmentIds: string[] }> {
  return await withTransaction(async (tx) => {
    // Insert email first
    const [insertedEmail] = await tx
      .insert(emails)
      .values(data.email as any)
      .returning();

    if (!insertedEmail) {
      throw new Error('Failed to insert email');
    }

    const attachmentIds: string[] = [];

    // Insert attachments if any
    if (data.attachments && data.attachments.length > 0) {
      for (const attachment of data.attachments) {
        const [insertedAttachment] = await tx
          .insert(emailAttachments)
          .values({
            emailId: insertedEmail.id,
            filename: attachment.filename,
            mimeType: attachment.mimeType,
            size: attachment.size,
            url: attachment.url,
            contentId: attachment.contentId,
            isInline: attachment.isInline || false,
          } as any)
          .returning();

        if (insertedAttachment) {
          attachmentIds.push(insertedAttachment.id);
        }
      }
    }

    return {
      emailId: insertedEmail.id,
      attachmentIds,
    };
  });
}

/**
 * Update email and manage attachments atomically
 */
export async function updateEmailWithAttachments(
  emailId: string,
  updates: Partial<EmailWithAttachmentsData['email']>,
  newAttachments?: EmailWithAttachmentsData['attachments']
): Promise<{ emailId: string; attachmentIds: string[] }> {
  return await withTransaction(async (tx) => {
    // Update email
    await tx
      .update(emails)
      .set({
        ...updates,
        updatedAt: new Date(),
      } as any)
      .where(eq(emails.id, emailId));

    const attachmentIds: string[] = [];

    // Add new attachments if any
    if (newAttachments && newAttachments.length > 0) {
      for (const attachment of newAttachments) {
        const [insertedAttachment] = await tx
          .insert(emailAttachments)
          .values({
            emailId,
            filename: attachment.filename,
            mimeType: attachment.mimeType,
            size: attachment.size,
            url: attachment.url,
            contentId: attachment.contentId,
            isInline: attachment.isInline || false,
          } as any)
          .returning();

        if (insertedAttachment) {
          attachmentIds.push(insertedAttachment.id);
        }
      }
    }

    return {
      emailId,
      attachmentIds,
    };
  });
}

/**
 * Delete email and all its attachments atomically
 */
export async function deleteEmailWithAttachments(
  emailId: string
): Promise<void> {
  await withTransaction(async (tx) => {
    // Delete attachments first (foreign key constraint)
    await tx
      .delete(emailAttachments)
      .where(eq(emailAttachments.emailId, emailId));

    // Delete email
    await tx.delete(emails).where(eq(emails.id, emailId));
  });
}

/**
 * Batch insert multiple emails with their attachments atomically
 * All or nothing - if one fails, none are inserted
 */
export async function batchInsertEmailsWithAttachments(
  dataArray: EmailWithAttachmentsData[]
): Promise<Array<{ emailId: string; attachmentIds: string[] }>> {
  return await withTransaction(async (tx) => {
    const results: Array<{ emailId: string; attachmentIds: string[] }> = [];

    for (const data of dataArray) {
      // Insert email
      const [insertedEmail] = await tx
        .insert(emails)
        .values(data.email as any)
        .returning();

      if (!insertedEmail) {
        throw new Error(`Failed to insert email: ${data.email.subject}`);
      }

      const attachmentIds: string[] = [];

      // Insert attachments
      if (data.attachments && data.attachments.length > 0) {
        for (const attachment of data.attachments) {
          const [insertedAttachment] = await tx
            .insert(emailAttachments)
            .values({
              emailId: insertedEmail.id,
              filename: attachment.filename,
              mimeType: attachment.mimeType,
              size: attachment.size,
              url: attachment.url,
              contentId: attachment.contentId,
              isInline: attachment.isInline || false,
            } as any)
            .returning();

          if (insertedAttachment) {
            attachmentIds.push(insertedAttachment.id);
          }
        }
      }

      results.push({
        emailId: insertedEmail.id,
        attachmentIds,
      });
    }

    return results;
  });
}

// Export eq from drizzle-orm for use in delete operations
import { eq } from 'drizzle-orm';

