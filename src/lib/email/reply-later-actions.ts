'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails, emailAccounts } from '@/db/schema';
import { eq, and, isNotNull, inArray, gte } from 'drizzle-orm';
import type { Email } from '@/db/schema';

/**
 * Mark an email as Reply Later
 */
export async function markAsReplyLater(
  emailId: string,
  replyLaterUntil: Date,
  note?: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  console.log('[markAsReplyLater] Called with:', { emailId, replyLaterUntil, note });
  
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log('[markAsReplyLater] User:', user?.id);

    if (!user) {
      console.error('[markAsReplyLater] No user found');
      return { success: false, error: 'Unauthorized' };
    }

    // Verify email belongs to user's accounts
    const userAccountIds = await db
      .select({ id: emailAccounts.id })
      .from(emailAccounts)
      .where(eq(emailAccounts.userId, user.id));

    const accountIds = userAccountIds.map((acc) => acc.id);
    console.log('[markAsReplyLater] User account IDs:', accountIds);

    const result = await db
      .update(emails)
      .set({
        replyLaterUntil,
        replyLaterNote: note || null,
        updatedAt: new Date(),
      })
      .where(
        and(eq(emails.id, emailId), inArray(emails.accountId, accountIds))
      )
      .returning({ id: emails.id });

    console.log('[markAsReplyLater] Database update result:', result);

    if (result.length === 0) {
      console.error('[markAsReplyLater] No rows updated - email not found or access denied');
      return { success: false, error: 'Email not found or access denied' };
    }

    console.log('[markAsReplyLater] Success!');
    return { success: true };
  } catch (error) {
    console.error('Error marking email as reply later:', error);
    return { success: false, error: 'Failed to mark email as reply later' };
  }
}

/**
 * Get all Reply Later emails for current user
 */
export async function getReplyLaterEmails(): Promise<{
  success: boolean;
  emails?: Email[];
  error?: string;
}> {
  console.log('[getReplyLaterEmails] Called');
  
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log('[getReplyLaterEmails] User:', user?.id);

    if (!user) {
      console.error('[getReplyLaterEmails] No user found');
      return { success: false, error: 'Unauthorized' };
    }

    // Get user's account IDs
    const userAccountIds = await db
      .select({ id: emailAccounts.id })
      .from(emailAccounts)
      .where(eq(emailAccounts.userId, user.id));

    const accountIds = userAccountIds.map((acc) => acc.id);
    console.log('[getReplyLaterEmails] User account IDs:', accountIds);

    if (accountIds.length === 0) {
      console.log('[getReplyLaterEmails] No accounts found');
      return { success: true, emails: [] };
    }

    // Fetch emails marked as reply later
    const replyLaterEmails = await db.query.emails.findMany({
      where: and(
        inArray(emails.accountId, accountIds),
        isNotNull(emails.replyLaterUntil),
        eq(emails.isTrashed, false)
      ),
      orderBy: [emails.replyLaterUntil],
      limit: 20, // Limit to prevent performance issues
    });

    console.log('[getReplyLaterEmails] Found emails:', replyLaterEmails.length, replyLaterEmails);

    return { success: true, emails: replyLaterEmails };
  } catch (error) {
    console.error('[getReplyLaterEmails] Error:', error);
    return { success: false, error: 'Failed to fetch reply later emails' };
  }
}

/**
 * Remove email from Reply Later queue
 */
export async function removeFromReplyLater(
  emailId: string
): Promise<{
  success: boolean;
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

    // Verify email belongs to user's accounts
    const userAccountIds = await db
      .select({ id: emailAccounts.id })
      .from(emailAccounts)
      .where(eq(emailAccounts.userId, user.id));

    const accountIds = userAccountIds.map((acc) => acc.id);

    const result = await db
      .update(emails)
      .set({
        replyLaterUntil: null,
        replyLaterNote: null,
        updatedAt: new Date(),
      })
      .where(
        and(eq(emails.id, emailId), inArray(emails.accountId, accountIds))
      )
      .returning({ id: emails.id });

    if (result.length === 0) {
      return { success: false, error: 'Email not found or access denied' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing from reply later:', error);
    return { success: false, error: 'Failed to remove from reply later' };
  }
}

/**
 * Generate AI draft reply for an email
 * This triggers the AI to generate a draft which can be retrieved later
 */
export async function generateReplyDraft(
  emailId: string
): Promise<{
  success: boolean;
  draftId?: string;
  draftContent?: string;
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

    // Get email details
    const userAccountIds = await db
      .select({ id: emailAccounts.id })
      .from(emailAccounts)
      .where(eq(emailAccounts.userId, user.id));

    const accountIds = userAccountIds.map((acc) => acc.id);

    const email = await db.query.emails.findFirst({
      where: and(
        eq(emails.id, emailId),
        inArray(emails.accountId, accountIds)
      ),
    });

    if (!email) {
      return { success: false, error: 'Email not found' };
    }

    // Generate AI reply via API route
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/reply`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: email.subject,
          bodyText: email.bodyText,
          bodyHtml: email.bodyHtml,
          senderName: email.fromAddress.name || email.fromAddress.email?.split('@')[0] || 'there',
          senderEmail: email.fromAddress.email,
          isDraft: true,
          emailId: email.id,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to generate draft');
    }

    const data = await response.json();

    if (data.success && data.reply) {
      return {
        success: true,
        draftContent: data.reply,
        draftId: data.draftId,
      };
    } else {
      throw new Error(data.error || 'Failed to generate reply');
    }
  } catch (error) {
    console.error('Error generating reply draft:', error);
    return { success: false, error: 'Failed to generate AI draft' };
  }
}

/**
 * Get overdue Reply Later emails (past their scheduled time)
 */
export async function getOverdueReplyLaterEmails(): Promise<{
  success: boolean;
  emails?: Email[];
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

    const userAccountIds = await db
      .select({ id: emailAccounts.id })
      .from(emailAccounts)
      .where(eq(emailAccounts.userId, user.id));

    const accountIds = userAccountIds.map((acc) => acc.id);

    if (accountIds.length === 0) {
      return { success: true, emails: [], count: 0 };
    }

    const now = new Date();

    const overdueEmails = await db.query.emails.findMany({
      where: and(
        inArray(emails.accountId, accountIds),
        isNotNull(emails.replyLaterUntil),
        eq(emails.isTrashed, false)
        // Note: lt() comparison for dates needs proper handling
      ),
      orderBy: [emails.replyLaterUntil],
    });

    // Filter overdue emails in JavaScript (safer than SQL date comparison)
    const filteredOverdue = overdueEmails.filter(
      (email) =>
        email.replyLaterUntil && new Date(email.replyLaterUntil) < now
    );

    return {
      success: true,
      emails: filteredOverdue,
      count: filteredOverdue.length,
    };
  } catch (error) {
    console.error('Error fetching overdue reply later emails:', error);
    return { success: false, error: 'Failed to fetch overdue emails' };
  }
}

