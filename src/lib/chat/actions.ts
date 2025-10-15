'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails, contacts, emailAccounts } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

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
  accountId?: string;
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

    // TODO: Implement actual email sending via provider
    // For now, return success
    console.log('Sending email:', {
      from: account.emailAddress,
      to: params.to,
      subject: params.subject,
      body: params.body,
    });

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
