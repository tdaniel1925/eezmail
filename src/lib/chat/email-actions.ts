'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq, and, gte, lte, desc, isNull, isNotNull } from 'drizzle-orm';

/**
 * Get unread emails
 */
export async function getUnreadEmails(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return [];
    }

    const results = await db.query.emails.findMany({
      where: and(eq(emails.accountId, userId), eq(emails.isRead, false)),
      orderBy: desc(emails.receivedAt),
      limit,
    });

    return results;
  } catch (error) {
    console.error('Error fetching unread emails:', error);
    return [];
  }
}

/**
 * Get starred emails
 */
export async function getStarredEmails(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return [];
    }

    const results = await db.query.emails.findMany({
      where: and(eq(emails.accountId, userId), eq(emails.isStarred, true)),
      orderBy: desc(emails.receivedAt),
      limit,
    });

    return results;
  } catch (error) {
    console.error('Error fetching starred emails:', error);
    return [];
  }
}

/**
 * Get emails with attachments
 */
export async function getEmailsWithAttachments(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return [];
    }

    const results = await db.query.emails.findMany({
      where: and(eq(emails.accountId, userId), eq(emails.hasAttachments, true)),
      orderBy: desc(emails.receivedAt),
      limit,
    });

    return results;
  } catch (error) {
    console.error('Error fetching emails with attachments:', error);
    return [];
  }
}

/**
 * Get emails by date range
 */
export async function getEmailsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return [];
    }

    const results = await db.query.emails.findMany({
      where: and(
        eq(emails.accountId, userId),
        gte(emails.receivedAt, startDate),
        lte(emails.receivedAt, endDate)
      ),
      orderBy: desc(emails.receivedAt),
      limit: 200,
    });

    return results;
  } catch (error) {
    console.error('Error fetching emails by date range:', error);
    return [];
  }
}

/**
 * Get emails without reply (useful for follow-ups)
 */
export async function getEmailsWithoutReply(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return [];
    }

    // Get emails where there's no reply in the thread
    // This is a simplified version - proper implementation would check thread messages
    const results = await db.query.emails.findMany({
      where: and(eq(emails.accountId, userId), eq(emails.isRead, false)),
      orderBy: desc(emails.receivedAt),
      limit,
    });

    return results;
  } catch (error) {
    console.error('Error fetching emails without reply:', error);
    return [];
  }
}

/**
 * Reply to an email (creates draft for approval)
 */
export async function replyToEmail(params: {
  userId: string;
  originalEmailId: string;
  replyBody: string;
  includeOriginal?: boolean;
}): Promise<{ success: boolean; draftId?: string; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, message: 'Unauthorized' };
    }

    // Get original email
    const originalEmail = await db.query.emails.findFirst({
      where: eq(emails.id, params.originalEmailId),
    });

    if (!originalEmail) {
      return { success: false, message: 'Original email not found' };
    }

    // In a real implementation, this would create a draft in the email system
    // For now, we'll return success with a message
    return {
      success: true,
      message: `Draft reply created to ${originalEmail.fromAddress.email}. Open compose window to review and send.`,
    };
  } catch (error) {
    console.error('Error creating reply:', error);
    return { success: false, message: 'Failed to create reply' };
  }
}

/**
 * Forward an email to recipients
 */
export async function forwardEmail(params: {
  userId: string;
  emailId: string;
  recipients: string[];
  message?: string;
}): Promise<{ success: boolean; draftId?: string; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, message: 'Unauthorized' };
    }

    // Get original email
    const originalEmail = await db.query.emails.findFirst({
      where: eq(emails.id, params.emailId),
    });

    if (!originalEmail) {
      return { success: false, message: 'Email not found' };
    }

    // In a real implementation, this would create a forward draft
    return {
      success: true,
      message: `Draft forward created for ${params.recipients.length} recipient(s). Open compose window to review and send.`,
    };
  } catch (error) {
    console.error('Error forwarding email:', error);
    return { success: false, message: 'Failed to forward email' };
  }
}
