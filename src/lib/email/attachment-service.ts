'use server';

/**
 * Attachment Service
 * Handles email attachment processing with on-demand downloading
 *
 * Strategy:
 * - Save metadata during email sync (fast)
 * - Download files on-demand when user requests (lazy loading)
 * - Store in Supabase Storage
 */

import { db } from '@/lib/db';
import { emailAttachments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

export interface AttachmentMetadata {
  filename: string;
  contentType: string;
  size: number;
  contentId?: string;
  isInline?: boolean;
  providerAttachmentId?: string;
}

interface SaveMetadataParams {
  emailId: string;
  accountId: string;
  userId: string;
  emailSubject: string;
  emailFrom: string;
  emailReceivedAt: Date;
  attachments: AttachmentMetadata[];
}

interface DownloadParams {
  attachmentId: string;
  provider: 'gmail' | 'outlook' | 'imap';
  messageId: string;
  providerAttachmentId?: string;
  accessToken?: string;
  imapConfig?: {
    host: string;
    port: number;
    user: string;
    password: string;
    tls: boolean;
  };
}

interface UploadAndSaveParams {
  emailId: string;
  accountId: string;
  userId: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
  emailSubject?: string;
  emailFrom?: string;
  emailReceivedAt?: Date;
  isInline?: boolean;
  contentId?: string;
}

/**
 * Sanitize filename for safe storage
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .substring(0, 255); // Limit length
}

/**
 * Process email attachments during sync
 * Saves metadata only, downloads on-demand
 */
export async function processEmailAttachments(
  emailId: string,
  message: any,
  accountId: string,
  userId: string,
  provider: 'gmail' | 'outlook' | 'imap'
): Promise<void> {
  try {
    console.log(
      `📎 Processing attachments for email: ${emailId} (${provider})`
    );

    let attachmentMetadata: AttachmentMetadata[] = [];

    // Extract metadata based on provider
    if (provider === 'imap' && message.attachments) {
      attachmentMetadata = message.attachments
        .filter((att: any) => {
          // Filter out inline images/embedded content (signatures, logos, etc.)
          const isInline = att.contentDisposition === 'inline' || att.contentId;
          return !isInline;
        })
        .map((att: any) => ({
          filename: att.filename || 'untitled',
          contentType: att.contentType || 'application/octet-stream',
          size: att.size || att.content?.length || 0,
          contentId: att.contentId,
          isInline: false, // Already filtered out inline
        }));
    } else if (provider === 'gmail' && message.payload?.parts) {
      attachmentMetadata = message.payload.parts
        .filter((part: any) => {
          // Must have filename and attachmentId
          if (!part.filename || !part.body?.attachmentId) return false;

          // Filter out inline images/embedded content
          const isInline = part.headers?.some(
            (h: any) =>
              h.name === 'Content-Disposition' && h.value.includes('inline')
          );
          const hasContentId = part.headers?.some(
            (h: any) => h.name === 'Content-ID'
          );

          return !isInline && !hasContentId;
        })
        .map((part: any) => ({
          filename: part.filename,
          contentType: part.mimeType || 'application/octet-stream',
          size: part.body.size || 0,
          providerAttachmentId: part.body.attachmentId,
          isInline: false, // Already filtered out inline
        }));
    } else if (provider === 'outlook' && message.hasAttachments) {
      // For Outlook, we'll fetch attachments separately
      // Just save a placeholder for now
      attachmentMetadata = [
        {
          filename: 'attachment',
          contentType: 'application/octet-stream',
          size: 0,
          providerAttachmentId: message.id, // We'll fetch later
        },
      ];
    }

    if (attachmentMetadata.length === 0) {
      console.log('No attachments found in message');
      return;
    }

    // Get email context for search
    const emailSubject = message.subject || '';
    const emailFrom =
      typeof message.from === 'string'
        ? message.from
        : message.from?.emailAddress?.address ||
          message.from?.email ||
          message.fromAddress?.email ||
          '';
    const emailReceivedAt =
      new Date(
        message.receivedDateTime || message.receivedAt || message.date
      ) || new Date();

    // For IMAP, upload attachments immediately during sync (we have the content)
    if (provider === 'imap' && message.attachments) {
      // Create a properly paired array of attachments and their metadata
      const nonInlineAttachments = message.attachments.filter(
        (att: any) => !(att.contentDisposition === 'inline' || att.contentId)
      );

      for (let i = 0; i < nonInlineAttachments.length; i++) {
        const att = nonInlineAttachments[i];
        const metadata = attachmentMetadata[i];

        // Safety check - ensure metadata exists
        if (!metadata) {
          console.error(
            `⚠️  Metadata missing for attachment at index ${i}, skipping...`
          );
          continue;
        }

        // Upload to storage immediately
        if (att.content && Buffer.isBuffer(att.content)) {
          try {
            await uploadAndSave({
              emailId,
              accountId,
              userId,
              filename: sanitizeFilename(metadata.filename),
              originalFilename: metadata.filename,
              mimeType: metadata.contentType,
              size: metadata.size,
              buffer: att.content,
              emailSubject,
              emailFrom,
              emailReceivedAt,
              isInline: false,
              contentId: metadata.contentId,
            });
          } catch (uploadError) {
            console.error(
              `Failed to upload IMAP attachment ${metadata.filename}:`,
              uploadError
            );
            // Continue with next attachment even if one fails
          }
        }
      }
    } else {
      // For Gmail/Outlook, save metadata only (download on-demand later)
      await saveAttachmentMetadata({
        emailId,
        accountId,
        userId,
        emailSubject,
        emailFrom,
        emailReceivedAt,
        attachments: attachmentMetadata,
      });
    }

    console.log(`✅ Saved ${attachmentMetadata.length} attachment(s) metadata`);
  } catch (error) {
    console.error('Error processing email attachments:', error);
    // Don't throw - we don't want to block email sync
  }
}

/**
 * Save attachment metadata to database
 */
async function saveAttachmentMetadata(
  params: SaveMetadataParams
): Promise<void> {
  const {
    emailId,
    accountId,
    userId,
    emailSubject,
    emailFrom,
    emailReceivedAt,
    attachments,
  } = params;

  for (const att of attachments) {
    try {
      const sanitizedFilename = sanitizeFilename(att.filename);

      // Check if attachment already exists for this email + filename
      const existingAttachment = await db
        .select()
        .from(emailAttachments)
        .where(
          and(
            eq(emailAttachments.emailId, emailId),
            eq(emailAttachments.originalFilename, att.filename)
          )
        )
        .limit(1);

      if (existingAttachment.length > 0) {
        console.log(`⏭️  Skipping duplicate attachment: ${att.filename}`);
        continue; // Skip this attachment, it already exists
      }

      await db.insert(emailAttachments).values({
        emailId,
        accountId,
        userId,
        filename: sanitizedFilename,
        originalFilename: att.filename,
        contentType: att.contentType,
        size: att.size,
        contentId: att.contentId || null,
        isInline: att.isInline || false,
        providerAttachmentId: att.providerAttachmentId || null,
        downloadStatus: 'pending', // Not downloaded yet
        storageUrl: null,
        storageKey: null,
        emailSubject,
        emailFrom,
        emailReceivedAt,
        isScanned: false,
        isSafe: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error(
        `Failed to save attachment metadata ${att.filename}:`,
        error
      );
    }
  }
}

/**
 * Download attachment from provider and upload to storage
 * Called on-demand when user clicks download
 */
export async function downloadAndStore(
  params: DownloadParams
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    console.log(`⬇️ Downloading attachment: ${params.attachmentId}`);

    // Get attachment metadata
    const attachment = await db.query.emailAttachments.findFirst({
      where: eq(emailAttachments.id, params.attachmentId),
    });

    if (!attachment) {
      return { success: false, error: 'Attachment not found' };
    }

    // Check if already downloaded
    if (attachment.downloadStatus === 'completed' && attachment.storageUrl) {
      console.log('✅ Attachment already downloaded');
      return { success: true, url: attachment.storageUrl };
    }

    // Mark as downloading
    await db
      .update(emailAttachments)
      .set({ downloadStatus: 'downloading', updatedAt: new Date() })
      .where(eq(emailAttachments.id, params.attachmentId));

    // Download from provider
    let buffer: Buffer | null = null;

    if (
      params.provider === 'gmail' &&
      params.accessToken &&
      params.providerAttachmentId
    ) {
      buffer = await downloadFromGmail(
        params.messageId,
        params.providerAttachmentId,
        params.accessToken
      );
    } else if (params.provider === 'outlook' && params.accessToken) {
      buffer = await downloadFromMicrosoftGraph(
        params.messageId,
        params.accessToken
      );
    } else if (params.provider === 'imap' && params.imapConfig) {
      buffer = await downloadFromImap(
        params.messageId,
        attachment.originalFilename,
        params.imapConfig
      );
    }

    if (!buffer) {
      await db
        .update(emailAttachments)
        .set({ downloadStatus: 'failed', updatedAt: new Date() })
        .where(eq(emailAttachments.id, params.attachmentId));
      return { success: false, error: 'Failed to download from provider' };
    }

    // Upload to Supabase Storage
    const supabase = await createClient();
    const storagePath = `attachments/${attachment.userId}/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Date.now()}-${attachment.filename}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('email-attachments')
      .upload(storagePath, buffer, {
        contentType: attachment.contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      await db
        .update(emailAttachments)
        .set({ downloadStatus: 'failed', updatedAt: new Date() })
        .where(eq(emailAttachments.id, params.attachmentId));
      return { success: false, error: 'Failed to upload to storage' };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('email-attachments')
      .getPublicUrl(storagePath);

    // Update database
    await db
      .update(emailAttachments)
      .set({
        downloadStatus: 'completed',
        storageUrl: urlData?.publicUrl || null,
        storageKey: storagePath,
        updatedAt: new Date(),
      })
      .where(eq(emailAttachments.id, params.attachmentId));

    console.log(`✅ Attachment downloaded and stored: ${storagePath}`);
    return { success: true, url: urlData?.publicUrl };
  } catch (error) {
    console.error('Error downloading attachment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Download attachment from Gmail
 */
async function downloadFromGmail(
  messageId: string,
  attachmentId: string,
  accessToken: string
): Promise<Buffer | null> {
  try {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.statusText}`);
    }

    const data = await response.json();
    // Gmail returns base64url encoded data
    return Buffer.from(data.data, 'base64url');
  } catch (error) {
    console.error('Error downloading from Gmail:', error);
    return null;
  }
}

/**
 * Download attachment from Microsoft Graph
 */
async function downloadFromMicrosoftGraph(
  messageId: string,
  accessToken: string
): Promise<Buffer | null> {
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages/${messageId}/attachments`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.statusText}`);
    }

    const data = await response.json();
    const attachments = data.value || [];

    if (attachments.length === 0) {
      return null;
    }

    // Get first file attachment
    const fileAttachment = attachments.find(
      (att: any) => att['@odata.type'] === '#microsoft.graph.fileAttachment'
    );

    if (!fileAttachment) {
      return null;
    }

    // Microsoft returns base64 encoded data
    return Buffer.from(fileAttachment.contentBytes, 'base64');
  } catch (error) {
    console.error('Error downloading from Microsoft Graph:', error);
    return null;
  }
}

/**
 * Download attachment from IMAP
 * Note: For IMAP, we should have saved the attachment data during sync
 * This is a fallback that re-fetches the message
 */
async function downloadFromImap(
  messageId: string,
  filename: string,
  imapConfig: {
    host: string;
    port: number;
    user: string;
    password: string;
    tls: boolean;
  }
): Promise<Buffer | null> {
  try {
    // For IMAP, we'd need to re-connect and fetch the message
    // This is complex and slow - better to save attachment data during sync
    // For now, return null (IMAP attachments should be saved during sync)
    console.warn(
      'IMAP on-demand download not implemented - save during sync instead'
    );
    return null;
  } catch (error) {
    console.error('Error downloading from IMAP:', error);
    return null;
  }
}

/**
 * Upload attachment to storage and save to database
 * Used for outgoing emails
 */
export async function uploadAndSave(
  params: UploadAndSaveParams
): Promise<void> {
  try {
    // Check if attachment already exists for this email + filename
    const existingAttachment = await db
      .select()
      .from(emailAttachments)
      .where(
        and(
          eq(emailAttachments.emailId, params.emailId),
          eq(emailAttachments.originalFilename, params.originalFilename)
        )
      )
      .limit(1);

    if (existingAttachment.length > 0) {
      console.log(`⏭️  Skipping duplicate attachment upload: ${params.originalFilename}`);
      return; // Skip this attachment, it already exists
    }

    const supabase = await createClient();

    // Generate storage path
    const sanitizedFilename = sanitizeFilename(params.originalFilename);
    const storagePath = `attachments/${params.userId}/sent/${Date.now()}-${sanitizedFilename}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('email-attachments')
      .upload(storagePath, params.buffer, {
        contentType: params.mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('email-attachments')
      .getPublicUrl(storagePath);

    // Save to database
    await db.insert(emailAttachments).values({
      emailId: params.emailId,
      accountId: params.accountId,
      userId: params.userId,
      filename: sanitizedFilename,
      originalFilename: params.originalFilename,
      contentType: params.mimeType,
      size: params.size,
      storageUrl: urlData?.publicUrl || null,
      storageKey: storagePath,
      downloadStatus: 'completed', // Already have the file
      isInline: params.isInline || false,
      contentId: params.contentId || null,
      emailSubject: params.emailSubject || null,
      emailFrom: params.emailFrom || null,
      emailReceivedAt: params.emailReceivedAt || new Date(),
      isScanned: false,
      isSafe: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`✅ Uploaded and saved attachment: ${params.originalFilename}`);
  } catch (error) {
    console.error(
      `Failed to upload attachment ${params.originalFilename}:`,
      error
    );
    throw error;
  }
}

/**
 * Extract text from PDF for search
 * Optional - requires pdf-parse package
 */
export async function extractTextFromPdf(
  buffer: Buffer
): Promise<string | null> {
  try {
    // Requires: npm install pdf-parse
    // const pdfParse = require('pdf-parse');
    // const data = await pdfParse(buffer);
    // return data.text || null;

    // Not implemented yet
    return null;
  } catch (error) {
    console.error('PDF text extraction failed:', error);
    return null;
  }
}
