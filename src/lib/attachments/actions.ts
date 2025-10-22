/**
 * Server Actions for Attachment Descriptions
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAttachments, emails } from '@/db/schema';
import { eq, isNull, and } from 'drizzle-orm';
import { generateAIDescription, type AttachmentContext } from '@/lib/ai/attachment-describer';

/**
 * Generate AI description for a single attachment
 */
export async function generateAttachmentDescription(
  attachmentId: string
): Promise<{ success: boolean; description?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Fetch attachment with email context
    const attachment = await db.query.emailAttachments.findFirst({
      where: eq(emailAttachments.id, attachmentId),
      with: {
        email: {
          columns: {
            subject: true,
            bodyText: true,
            fromAddress: true,
          },
        },
      },
    });

    if (!attachment) {
      return { success: false, error: 'Attachment not found' };
    }

    // Build context for AI
    const context: AttachmentContext = {
      filename: attachment.filename,
      contentType: attachment.contentType,
      size: attachment.size,
      emailSubject: attachment.email?.subject,
      emailBodyPreview: attachment.email?.bodyText?.substring(0, 500),
      senderName: (attachment.email?.fromAddress as any)?.name || '',
    };

    // Generate description
    const description = await generateAIDescription(context);

    // Update database
    await db
      .update(emailAttachments)
      .set({
        aiDescription: description,
        aiDescriptionGeneratedAt: new Date(),
      })
      .where(eq(emailAttachments.id, attachmentId));

    return { success: true, description };
  } catch (error) {
    console.error('Error generating attachment description:', error);
    return {
      success: false,
      error: 'Failed to generate description',
    };
  }
}

/**
 * Batch generate descriptions for multiple attachments
 */
export async function generateAttachmentDescriptions(
  attachmentIds: string[]
): Promise<{
  success: boolean;
  generated: number;
  failed: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, generated: 0, failed: 0, error: 'Unauthorized' };
    }

    let generated = 0;
    let failed = 0;

    // Process each attachment
    for (const attachmentId of attachmentIds) {
      const result = await generateAttachmentDescription(attachmentId);
      if (result.success) {
        generated++;
      } else {
        failed++;
      }
    }

    return { success: true, generated, failed };
  } catch (error) {
    console.error('Error in batch description generation:', error);
    return {
      success: false,
      generated: 0,
      failed: attachmentIds.length,
      error: 'Batch generation failed',
    };
  }
}

/**
 * Get attachment description (from DB or generate if needed)
 */
export async function getAttachmentDescription(
  attachmentId: string
): Promise<{ success: boolean; description?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if description already exists
    const attachment = await db.query.emailAttachments.findFirst({
      where: eq(emailAttachments.id, attachmentId),
      columns: {
        aiDescription: true,
      },
    });

    if (attachment?.aiDescription) {
      return { success: true, description: attachment.aiDescription };
    }

    // Generate if doesn't exist
    return await generateAttachmentDescription(attachmentId);
  } catch (error) {
    console.error('Error getting attachment description:', error);
    return { success: false, error: 'Failed to get description' };
  }
}

/**
 * Generate descriptions for all attachments without descriptions
 * (Background job function)
 */
export async function generateMissingDescriptions(
  limit: number = 20
): Promise<{ success: boolean; generated: number; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, generated: 0, error: 'Unauthorized' };
    }

    // Find attachments without descriptions
    const attachmentsWithoutDesc = await db.query.emailAttachments.findMany({
      where: isNull(emailAttachments.aiDescription),
      limit,
      with: {
        email: {
          columns: {
            userId: true,
          },
        },
      },
    });

    // Filter to only user's attachments
    const userAttachments = attachmentsWithoutDesc.filter(
      (att) => att.email?.userId === user.id
    );

    const attachmentIds = userAttachments.map((att) => att.id);

    if (attachmentIds.length === 0) {
      return { success: true, generated: 0 };
    }

    const result = await generateAttachmentDescriptions(attachmentIds);

    return { success: true, generated: result.generated };
  } catch (error) {
    console.error('Error generating missing descriptions:', error);
    return { success: false, generated: 0, error: 'Failed to generate descriptions' };
  }
}

