'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  bulkArchiveEmails,
  bulkDeleteEmails,
  toggleEmailStar,
} from '@/lib/chat/actions';

/**
 * Archive a single email
 */
export async function archiveEmail(
  emailId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    const result = await bulkArchiveEmails({
      userId: user.id,
      emailIds: [emailId],
    });

    return result;
  } catch (error) {
    console.error('Error archiving email:', error);
    return { success: false, message: 'Failed to archive email' };
  }
}

/**
 * Delete a single email (soft delete by default)
 */
export async function deleteEmail(
  emailId: string,
  permanent = false
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: 'Unauthorized' };
    }

    const result = await bulkDeleteEmails({
      userId: user.id,
      emailIds: [emailId],
      permanent,
    });

    return result;
  } catch (error) {
    console.error('Error deleting email:', error);
    return { success: false, message: 'Failed to delete email' };
  }
}

/**
 * Star/unstar a single email
 */
export async function starEmail(
  emailId: string,
  isStarred: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await toggleEmailStar({
      emailId,
      isStarred,
    });

    return {
      success: result.success,
      message: result.success
        ? `Email ${isStarred ? 'starred' : 'unstarred'}`
        : result.error || 'Failed to update email',
    };
  } catch (error) {
    console.error('Error starring email:', error);
    return { success: false, message: 'Failed to update email' };
  }
}

/**
 * Get email data formatted for reply
 */
export async function getEmailForReply(emailId: string): Promise<{
  success: boolean;
  data?: {
    to: string;
    subject: string;
    body: string;
    replyToEmailId: string;
  };
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const email = await db.query.emails.findFirst({
      where: eq(emails.id, emailId),
    });

    if (!email) {
      return { success: false, error: 'Email not found' };
    }

    // Extract sender email
    const fromEmail =
      typeof email.fromAddress === 'object'
        ? (email.fromAddress as any).email
        : email.fromAddress;

    // Format quoted reply body
    const originalBody = email.bodyText || email.bodyHtml || '';
    const quotedBody = `\n\n---\nOn ${email.receivedAt.toLocaleDateString()}, ${fromEmail} wrote:\n\n${originalBody}`;

    return {
      success: true,
      data: {
        to: fromEmail,
        subject: email.subject.startsWith('Re:')
          ? email.subject
          : `Re: ${email.subject}`,
        body: quotedBody,
        replyToEmailId: emailId,
      },
    };
  } catch (error) {
    console.error('Error getting email for reply:', error);
    return { success: false, error: 'Failed to load email data' };
  }
}

/**
 * Get email data formatted for forward
 */
export async function getEmailForForward(emailId: string): Promise<{
  success: boolean;
  data?: {
    subject: string;
    body: string;
    forwardFromEmailId: string;
  };
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const email = await db.query.emails.findFirst({
      where: eq(emails.id, emailId),
    });

    if (!email) {
      return { success: false, error: 'Email not found' };
    }

    // Extract sender info
    const fromEmail =
      typeof email.fromAddress === 'object'
        ? (email.fromAddress as any).email
        : email.fromAddress;
    const fromName =
      typeof email.fromAddress === 'object'
        ? (email.fromAddress as any).name || fromEmail
        : fromEmail;

    // Format forwarded message body
    const originalBody = email.bodyText || email.bodyHtml || '';
    const forwardedBody = `\n\n---------- Forwarded message ---------\nFrom: ${fromName} <${fromEmail}>\nDate: ${email.receivedAt.toLocaleString()}\nSubject: ${email.subject}\n\n${originalBody}`;

    return {
      success: true,
      data: {
        subject: email.subject.startsWith('Fwd:')
          ? email.subject
          : `Fwd: ${email.subject}`,
        body: forwardedBody,
        forwardFromEmailId: emailId,
      },
    };
  } catch (error) {
    console.error('Error getting email for forward:', error);
    return { success: false, error: 'Failed to load email data' };
  }
}
