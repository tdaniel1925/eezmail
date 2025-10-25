'use server';

import { db } from '@/lib/db';
import { emails, emailThreads, emailAccounts } from '@/db/schema';
import { eq, and, isNull, gt, sql, lt, inArray } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

/**
 * Helper function to get user's account IDs
 */
async function getUserAccountIds(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const userAccounts = await db
    .select({ id: emailAccounts.id })
    .from(emailAccounts)
    .where(eq(emailAccounts.userId, user.id));

  return userAccounts.map((acc) => acc.id);
}

/**
 * Get unread count for Inbox
 */
export async function getInboxUnreadCount(): Promise<number> {
  try {
    const accountIds = await getUserAccountIds();
    if (accountIds.length === 0) return 0;

    const result = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(emails)
      .where(
        and(
          inArray(emails.accountId, accountIds),
          eq(emails.folderName, 'inbox'),
          eq(emails.isRead, false),
          eq(emails.emailCategory, 'inbox'),
          eq(emails.isTrashed, false)
        )
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error getting inbox unread count:', error);
    return 0;
  }
}

/**
 * Get drafts count
 */
export async function getDraftsCount(): Promise<number> {
  try {
    const accountIds = await getUserAccountIds();
    if (accountIds.length === 0) return 0;

    const result = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(emails)
      .where(
        and(
          inArray(emails.accountId, accountIds),
          eq(emails.isDraft, true),
          eq(emails.isTrashed, false)
        )
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error getting drafts count:', error);
    return 0;
  }
}

/**
 * Get Reply Queue count (emails needing response)
 */
export async function getReplyQueueCount(): Promise<number> {
  try {
    const accountIds = await getUserAccountIds();
    if (accountIds.length === 0) return 0;

    const result = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(emails)
      .where(
        and(
          inArray(emails.accountId, accountIds),
          eq(emails.needsReply, true),
          eq(emails.emailCategory, 'inbox'),
          eq(emails.isTrashed, false),
          eq(emails.folderName, 'inbox')
        )
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error getting reply queue count:', error);
    return 0;
  }
}

/**
 * Get Screener count (unscreened emails from unknown senders)
 */
export async function getScreenerCount(): Promise<number> {
  try {
    const accountIds = await getUserAccountIds();
    if (accountIds.length === 0) return 0;

    const result = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(emails)
      .where(
        and(
          inArray(emails.accountId, accountIds),
          eq(emails.screeningStatus, 'pending'),
          eq(emails.isTrashed, false)
        )
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error getting screener count:', error);
    return 0;
  }
}

/**
 * Get News Feed count (newsletters, subscriptions)
 */
export async function getNewsFeedCount(): Promise<number> {
  try {
    const accountIds = await getUserAccountIds();
    if (accountIds.length === 0) return 0;

    const result = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(emails)
      .where(
        and(
          inArray(emails.accountId, accountIds),
          eq(emails.emailCategory, 'newsletter'),
          eq(emails.isRead, false),
          eq(emails.isTrashed, false)
        )
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error getting news feed count:', error);
    return 0;
  }
}

/**
 * Get starred/flagged count
 */
export async function getStarredCount(): Promise<number> {
  try {
    const accountIds = await getUserAccountIds();
    if (accountIds.length === 0) return 0;

    const result = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(emails)
      .where(
        and(
          inArray(emails.accountId, accountIds),
          eq(emails.isStarred, true),
          eq(emails.isTrashed, false)
        )
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error getting starred count:', error);
    return 0;
  }
}

/**
 * Get scheduled emails count
 * TODO: Add sendAt field to emails table
 */
export async function getScheduledCount(): Promise<number> {
  try {
    // Field not implemented yet - return 0
    // When implemented, query emails where sendAt > now
    return 0;
  } catch (error) {
    console.error('Error getting scheduled count:', error);
    return 0;
  }
}

/**
 * Get spam count
 */
export async function getSpamCount(): Promise<number> {
  try {
    const accountIds = await getUserAccountIds();
    if (accountIds.length === 0) return 0;

    const result = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(emails)
      .where(
        and(
          inArray(emails.accountId, accountIds),
          eq(emails.folderName, 'spam'),
          eq(emails.isTrashed, false)
        )
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error getting spam count:', error);
    return 0;
  }
}

/**
 * Get trash count
 */
export async function getTrashCount(): Promise<number> {
  try {
    const accountIds = await getUserAccountIds();
    if (accountIds.length === 0) return 0;

    const result = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(emails)
      .where(
        and(inArray(emails.accountId, accountIds), eq(emails.isTrashed, true))
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error getting trash count:', error);
    return 0;
  }
}

/**
 * Get unified inbox count (all unread emails across all folders)
 */
export async function getUnifiedInboxCount(): Promise<number> {
  try {
    const accountIds = await getUserAccountIds();
    if (accountIds.length === 0) return 0;

    const result = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(emails)
      .where(
        and(
          inArray(emails.accountId, accountIds),
          eq(emails.isRead, false),
          eq(emails.isTrashed, false),
          eq(emails.isDraft, false)
        )
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error getting unified inbox count:', error);
    return 0;
  }
}

/**
 * Get archive count (total archived emails)
 */
export async function getArchiveCount(): Promise<number> {
  try {
    const accountIds = await getUserAccountIds();
    if (accountIds.length === 0) return 0;

    const result = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(emails)
      .where(
        and(
          inArray(emails.accountId, accountIds),
          eq(emails.folderName, 'archive'),
          eq(emails.isTrashed, false)
        )
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error getting archive count:', error);
    return 0;
  }
}

/**
 * Get sent count (TOTAL sent emails - not filtered by read/unread)
 */
export async function getSentCount(): Promise<number> {
  try {
    const accountIds = await getUserAccountIds();
    if (accountIds.length === 0) return 0;

    const result = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(emails)
      .where(
        and(
          inArray(emails.accountId, accountIds),
          sql`LOWER(${emails.folderName}) LIKE '%sent%'`, // Match any folder with 'sent' in name
          eq(emails.isTrashed, false)
        )
      );

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error getting sent count:', error);
    return 0;
  }
}

/**
 * Get all folder counts at once (optimized)
 */
export async function getFolderCounts(): Promise<{
  inbox: number;
  drafts: number;
  replyQueue: number;
  screener: number;
  newsFeed: number;
  starred: number;
  scheduled: number;
  spam: number;
  trash: number;
  unifiedInbox: number;
  archive: number;
  sent: number;
}> {
  try {
    const [
      inbox,
      drafts,
      replyQueue,
      screener,
      newsFeed,
      starred,
      scheduled,
      spam,
      trash,
      unifiedInbox,
      archive,
      sent,
    ] = await Promise.all([
      getInboxUnreadCount(),
      getDraftsCount(),
      getReplyQueueCount(),
      getScreenerCount(),
      getNewsFeedCount(),
      getStarredCount(),
      getScheduledCount(),
      getSpamCount(),
      getTrashCount(),
      getUnifiedInboxCount(),
      getArchiveCount(),
      getSentCount(),
    ]);

    return {
      inbox,
      drafts,
      replyQueue,
      screener,
      newsFeed,
      starred,
      scheduled,
      spam,
      trash,
      unifiedInbox,
      archive,
      sent,
    };
  } catch (error) {
    console.error('Error getting folder counts:', error);
    return {
      inbox: 0,
      drafts: 0,
      replyQueue: 0,
      screener: 0,
      newsFeed: 0,
      starred: 0,
      scheduled: 0,
      spam: 0,
      trash: 0,
      unifiedInbox: 0,
      archive: 0,
      sent: 0,
    };
  }
}
