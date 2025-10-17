'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq, desc, inArray, and, or } from 'drizzle-orm';

/**
 * Get emails for the current user
 */
export async function getEmails(folderName?: string, limit: number = 25) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    console.log('📧 Fetching emails for user:', user.id);

    // Get user's email accounts
    const userAccounts = await db.query.emailAccounts.findMany({
      where: (accounts, { eq }) => eq(accounts.userId, user.id),
    });

    if (userAccounts.length === 0) {
      console.log('📧 No email accounts found for user');
      return { success: true, emails: [] };
    }

    const accountIds = userAccounts.map((account) => account.id);
    console.log('📧 Found accounts:', accountIds);

    // Build query with proper account filtering
    let whereConditions = [inArray(emails.accountId, accountIds)];

    // Add folder filter if specified
    if (folderName) {
      whereConditions.push(eq(emails.folderName, folderName));
    }

    const userEmails = await db
      .select()
      .from(emails)
      .where(
        whereConditions.length > 1
          ? and(...whereConditions)
          : whereConditions[0]
      )
      .orderBy(desc(emails.receivedAt))
      .limit(limit);
    console.log('📧 Found emails:', userEmails.length);

    return { success: true, emails: userEmails };
  } catch (error) {
    console.error('❌ Error fetching emails:', error);
    return { success: false, error: 'Failed to fetch emails' };
  }
}

/**
 * Get emails for a specific folder
 */
export async function getEmailsByFolder(
  folderName: string,
  limit: number = 25
) {
  return getEmails(folderName, limit);
}

/**
 * Get inbox emails (emailCategory = 'inbox')
 */
export async function getInboxEmails(limit: number = 25) {
  return getEmailsByCategory('inbox', limit);
}

/**
 * Get emails by category
 */
export async function getEmailsByCategory(
  category: string,
  limit: number = 25
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    console.log(`📧 Fetching ${category} emails for user:`, user.id);

    // Get user's email accounts
    const userAccounts = await db.query.emailAccounts.findMany({
      where: (accounts, { eq }) => eq(accounts.userId, user.id),
    });

    if (userAccounts.length === 0) {
      console.log('📧 No email accounts found for user');
      return { success: true, emails: [] };
    }

    const accountIds = userAccounts.map((account) => account.id);
    console.log('📧 Found accounts:', accountIds);

    // Get emails by category
    const categoryEmails = await db
      .select()
      .from(emails)
      .where(
        and(
          inArray(emails.accountId, accountIds),
          eq(emails.emailCategory, category as any)
        )
      )
      .orderBy(desc(emails.receivedAt))
      .limit(limit);

    console.log(`📧 Found ${category} emails:`, categoryEmails.length);

    return { success: true, emails: categoryEmails };
  } catch (error) {
    console.error(`❌ Error fetching ${category} emails:`, error);
    return { success: false, error: `Failed to fetch ${category} emails` };
  }
}

/**
 * Get unscreened emails (emailCategory = 'unscreened')
 */
export async function getUnscreenedEmails(limit: number = 25) {
  return getEmailsByCategory('unscreened', limit);
}

/**
 * Get newsfeed emails (emailCategory = 'newsfeed')
 */
export async function getNewsFeedEmails(limit: number = 25) {
  return getEmailsByCategory('newsfeed', limit);
}

/**
 * Get receipts emails (emailCategory = 'receipts')
 */
export async function getReceiptsEmails(limit: number = 25) {
  return getEmailsByCategory('receipts', limit);
}

/**
 * Get spam emails (emailCategory = 'spam')
 */
export async function getSpamEmails(limit: number = 25) {
  return getEmailsByCategory('spam', limit);
}

/**
 * Get reply queue emails (needsReply = true)
 */
export async function getReplyQueueEmails(limit: number = 50) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    console.log('📧 Fetching reply queue emails for user:', user.id);

    // Get user's email accounts
    const userAccounts = await db.query.emailAccounts.findMany({
      where: (accounts, { eq }) => eq(accounts.userId, user.id),
    });

    if (userAccounts.length === 0) {
      console.log('📧 No email accounts found for user');
      return { success: true, emails: [] };
    }

    const accountIds = userAccounts.map((account) => account.id);
    console.log('📧 Found accounts:', accountIds);

    // Get emails marked for reply
    const replyQueueEmails = await db
      .select()
      .from(emails)
      .where(
        and(
          inArray(emails.accountId, accountIds),
          eq(emails.needsReply, true),
          eq(emails.isTrashed, false)
        )
      )
      .orderBy(desc(emails.receivedAt))
      .limit(limit);

    console.log('📧 Found reply queue emails:', replyQueueEmails.length);

    return { success: true, emails: replyQueueEmails };
  } catch (error) {
    console.error('❌ Error fetching reply queue emails:', error);
    return { success: false, error: 'Failed to fetch reply queue emails' };
  }
}

/**
 * Get all mail from all accounts (unified inbox)
 */
export async function getAllMailEmails(limit: number = 100) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    console.log('📧 Fetching all mail for user:', user.id);

    // Get user's email accounts
    const userAccounts = await db.query.emailAccounts.findMany({
      where: (accounts, { eq }) => eq(accounts.userId, user.id),
    });

    if (userAccounts.length === 0) {
      console.log('📧 No email accounts found for user');
      return { success: true, emails: [] };
    }

    const accountIds = userAccounts.map((account) => account.id);
    console.log('📧 Found accounts:', accountIds);

    // Get all emails from all accounts (not trashed)
    const allEmails = await db
      .select()
      .from(emails)
      .where(
        and(
          inArray(emails.accountId, accountIds),
          eq(emails.isTrashed, false)
        )
      )
      .orderBy(desc(emails.receivedAt))
      .limit(limit);

    console.log('📧 Found all mail emails:', allEmails.length);

    return { success: true, emails: allEmails };
  } catch (error) {
    console.error('❌ Error fetching all mail:', error);
    return { success: false, error: 'Failed to fetch all mail' };
  }
}