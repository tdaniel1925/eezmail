'use server';

import { db } from '@/lib/db';
import { emails, emailAccounts } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { screenEmail as screenEmailAction } from '@/lib/screener/actions';

/**
 * Get count of unscreened emails
 */
export async function getUnscreenedCount(): Promise<{
  success: boolean;
  count?: number;
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

    // Get user's accounts
    const userAccounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
    });

    if (userAccounts.length === 0) {
      return { success: true, count: 0 };
    }

    const accountIds = userAccounts.map((acc) => acc.id);

    // Count unscreened emails
    const [result] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(emails)
      .where(
        and(
          sql`${emails.accountId} = ANY(${accountIds})`,
          eq(emails.emailCategory, 'unscreened')
        )
      );

    return { success: true, count: result.count };
  } catch (error) {
    console.error('Error getting unscreened count:', error);
    return { success: false, error: 'Failed to get unscreened count' };
  }
}

/**
 * Screen the current email (move to a category)
 */
export async function screenCurrentEmail(
  emailId: string,
  category: 'inbox' | 'newsfeed' | 'receipts' | 'spam' | string
): Promise<{
  success: boolean;
  message?: string;
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

    // Verify email belongs to user
    const email = await db.query.emails.findFirst({
      where: eq(emails.id, emailId),
    });

    if (!email) {
      return { success: false, error: 'Email not found' };
    }

    // Verify ownership
    const account = await db.query.emailAccounts.findFirst({
      where: eq(emailAccounts.id, email.accountId),
    });

    if (!account || account.userId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Use the existing screenEmail action
    const result = await screenEmailAction(emailId, category);

    if (result.success) {
      return {
        success: true,
        message: `Email moved to ${category}`,
      };
    }

    return { success: false, error: result.error };
  } catch (error) {
    console.error('Error screening email:', error);
    return { success: false, error: 'Failed to screen email' };
  }
}

/**
 * Suggest category for an email using AI logic
 */
export async function suggestCategoryForEmail(emailId: string): Promise<{
  success: boolean;
  category?: string;
  reason?: string;
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

    // Get email
    const email = await db.query.emails.findFirst({
      where: eq(emails.id, emailId),
    });

    if (!email) {
      return { success: false, error: 'Email not found' };
    }

    // Verify ownership
    const account = await db.query.emailAccounts.findFirst({
      where: eq(emailAccounts.id, email.accountId),
    });

    if (!account || account.userId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Simple categorization logic (can be enhanced with AI later)
    const subject = email.subject.toLowerCase();
    const bodyText = email.bodyText?.toLowerCase() || '';

    // Check for receipts/orders
    if (
      subject.includes('receipt') ||
      subject.includes('order') ||
      subject.includes('invoice') ||
      subject.includes('confirmation') ||
      bodyText.includes('order number') ||
      bodyText.includes('tracking number')
    ) {
      return {
        success: true,
        category: 'receipts',
        reason: 'Detected receipt/order keywords',
      };
    }

    // Check for newsletters
    if (
      subject.includes('newsletter') ||
      subject.includes('digest') ||
      subject.includes('weekly') ||
      subject.includes('daily') ||
      bodyText.includes('unsubscribe')
    ) {
      return {
        success: true,
        category: 'newsfeed',
        reason: 'Detected newsletter patterns',
      };
    }

    // Check for spam indicators
    if (
      subject.includes('urgent') ||
      subject.includes('act now') ||
      subject.includes('limited time') ||
      subject.includes('congratulations')
    ) {
      return {
        success: true,
        category: 'spam',
        reason: 'Detected spam-like language',
      };
    }

    // Default to inbox
    return {
      success: true,
      category: 'inbox',
      reason: 'Personal communication',
    };
  } catch (error) {
    console.error('Error suggesting category:', error);
    return { success: false, error: 'Failed to suggest category' };
  }
}

/**
 * Bulk screen multiple emails
 */
export async function bulkScreenEmails(
  emailIds: string[],
  category: string
): Promise<{
  success: boolean;
  screenedCount?: number;
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

    let screenedCount = 0;

    // Screen each email
    for (const emailId of emailIds) {
      const result = await screenCurrentEmail(emailId, category);
      if (result.success) {
        screenedCount++;
      }
    }

    return {
      success: true,
      screenedCount,
    };
  } catch (error) {
    console.error('Error bulk screening emails:', error);
    return { success: false, error: 'Failed to bulk screen emails' };
  }
}
