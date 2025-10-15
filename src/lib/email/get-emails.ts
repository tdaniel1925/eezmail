'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq, desc, inArray, and, or } from 'drizzle-orm';

/**
 * Get emails for the current user
 */
export async function getEmails(folderName?: string, limit: number = 50) {
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
  limit: number = 50
) {
  return getEmails(folderName, limit);
}

/**
 * Get inbox emails (emailCategory = 'inbox')
 */
export async function getInboxEmails(limit: number = 50) {
  return getEmailsByCategory('inbox', limit);
}

/**
 * Get emails by category
 */
export async function getEmailsByCategory(
  category: string,
  limit: number = 50
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
export async function getUnscreenedEmails(limit: number = 50) {
  return getEmailsByCategory('unscreened', limit);
}

/**
 * Get newsfeed emails (emailCategory = 'newsfeed')
 */
export async function getNewsFeedEmails(limit: number = 50) {
  return getEmailsByCategory('newsfeed', limit);
}

/**
 * Get receipts emails (emailCategory = 'receipts')
 */
export async function getReceiptsEmails(limit: number = 50) {
  return getEmailsByCategory('receipts', limit);
}

/**
 * Get spam emails (emailCategory = 'spam')
 */
export async function getSpamEmails(limit: number = 50) {
  return getEmailsByCategory('spam', limit);
}
