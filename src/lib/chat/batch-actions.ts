'use server';

import { db } from '@/lib/db';
import { emails, emailAccounts, type EmailCategory } from '@/db/schema';
import { eq, and, sql, lte, or, desc } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

interface CleanupCriteria {
  olderThanDays?: number;
  category?: EmailCategory;
  isRead?: boolean;
  hasAttachments?: boolean;
}

/**
 * Suggest bulk actions the user might want to take
 */
export async function suggestBulkActions(userId: string): Promise<{
  success: boolean;
  suggestions?: Array<{
    action: string;
    reason: string;
    estimatedCount: number;
    category: string;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const userAccounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
    });

    if (userAccounts.length === 0) {
      return { success: true, suggestions: [] };
    }

    const accountIds = userAccounts.map((acc) => acc.id);
    const suggestions: Array<{
      action: string;
      reason: string;
      estimatedCount: number;
      category: string;
    }> = [];

    // Check for old read emails
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [oldReadEmails] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(emails)
      .where(
        and(
          sql`${emails.accountId} = ANY(${accountIds})`,
          eq(emails.isRead, true),
          lte(emails.receivedAt, thirtyDaysAgo),
          eq(emails.folderName, 'inbox'),
          eq(emails.isTrashed, false)
        )
      );

    if (oldReadEmails.count > 10) {
      suggestions.push({
        action: 'Archive old read emails',
        reason: `You have ${oldReadEmails.count} read emails older than 30 days in your inbox`,
        estimatedCount: oldReadEmails.count,
        category: 'cleanup',
      });
    }

    // Check for old newsletters
    const [newsletters] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(emails)
      .where(
        and(
          sql`${emails.accountId} = ANY(${accountIds})`,
          eq(emails.emailCategory, 'newsletter'),
          eq(emails.isRead, true),
          eq(emails.isTrashed, false)
        )
      );

    if (newsletters.count > 20) {
      suggestions.push({
        action: 'Archive read newsletters',
        reason: `You have ${newsletters.count} read newsletters that could be archived`,
        estimatedCount: newsletters.count,
        category: 'newsletters',
      });
    }

    // Check for spam
    const [spamCount] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(emails)
      .where(
        and(
          sql`${emails.accountId} = ANY(${accountIds})`,
          eq(emails.folderName, 'spam')
        )
      );

    if (spamCount.count > 50) {
      suggestions.push({
        action: 'Empty spam folder',
        reason: `You have ${spamCount.count} emails in spam`,
        estimatedCount: spamCount.count,
        category: 'spam',
      });
    }

    // Check trash
    const [trashCount] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(emails)
      .where(
        and(
          sql`${emails.accountId} = ANY(${accountIds})`,
          eq(emails.isTrashed, true)
        )
      );

    if (trashCount.count > 100) {
      suggestions.push({
        action: 'Empty trash',
        reason: `You have ${trashCount.count} emails in trash`,
        estimatedCount: trashCount.count,
        category: 'trash',
      });
    }

    return { success: true, suggestions };
  } catch (error) {
    console.error('Error suggesting bulk actions:', error);
    return { success: false, error: 'Failed to suggest bulk actions' };
  }
}

/**
 * Auto-archive old newsletters
 */
export async function autoArchiveOldNewsletters(
  userId: string,
  olderThanDays: number = 30
): Promise<{
  success: boolean;
  archivedCount?: number;
  emailIds?: string[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const userAccounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
    });

    if (userAccounts.length === 0) {
      return { success: true, archivedCount: 0 };
    }

    const accountIds = userAccounts.map((acc) => acc.id);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Get newsletters to archive
    const newslettersToArchive = await db
      .select({
        id: emails.id,
        subject: emails.subject,
        receivedAt: emails.receivedAt,
      })
      .from(emails)
      .where(
        and(
          sql`${emails.accountId} = ANY(${accountIds})`,
          eq(emails.emailCategory, 'newsletter'),
          eq(emails.isRead, true),
          lte(emails.receivedAt, cutoffDate),
          eq(emails.isTrashed, false)
        )
      )
      .limit(100);

    // Return the list - frontend/calling code should handle archiving
    return {
      success: true,
      archivedCount: newslettersToArchive.length,
      emailIds: newslettersToArchive.map((e) => e.id),
    };
  } catch (error) {
    console.error('Error auto-archiving newsletters:', error);
    return { success: false, error: 'Failed to archive newsletters' };
  }
}

/**
 * Clean up inbox based on criteria
 */
export async function cleanupInbox(
  userId: string,
  criteria: CleanupCriteria
): Promise<{
  success: boolean;
  cleanedCount?: number;
  emailIds?: string[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const userAccounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
    });

    if (userAccounts.length === 0) {
      return { success: true, cleanedCount: 0 };
    }

    const accountIds = userAccounts.map((acc) => acc.id);

    // Build conditions
    const conditions = [
      sql`${emails.accountId} = ANY(${accountIds})`,
      eq(emails.folderName, 'inbox'),
      eq(emails.isTrashed, false),
    ];

    if (criteria.olderThanDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - criteria.olderThanDays);
      conditions.push(lte(emails.receivedAt, cutoffDate));
    }

    if (criteria.isRead !== undefined) {
      conditions.push(eq(emails.isRead, criteria.isRead));
    }

    if (criteria.category) {
      conditions.push(eq(emails.emailCategory, criteria.category));
    }

    if (criteria.hasAttachments !== undefined) {
      conditions.push(eq(emails.hasAttachments, criteria.hasAttachments));
    }

    // Get emails to clean
    const emailsToClean = await db
      .select({
        id: emails.id,
        subject: emails.subject,
        receivedAt: emails.receivedAt,
      })
      .from(emails)
      .where(and(...conditions))
      .limit(100);

    // Return the list - frontend/calling code should handle cleanup
    return {
      success: true,
      cleanedCount: emailsToClean.length,
      emailIds: emailsToClean.map((e) => e.id),
    };
  } catch (error) {
    console.error('Error cleaning up inbox:', error);
    return { success: false, error: 'Failed to clean up inbox' };
  }
}

/**
 * Organize emails by project keywords
 */
export async function organizeByProject(
  userId: string,
  projectKeywords: string[],
  targetLabel?: string
): Promise<{
  success: boolean;
  organizedCount?: number;
  emailIds?: string[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const userAccounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
    });

    if (userAccounts.length === 0) {
      return { success: true, organizedCount: 0 };
    }

    const accountIds = userAccounts.map((acc) => acc.id);

    // Build keyword search conditions
    const keywordConditions = projectKeywords.map((keyword) =>
      or(
        sql`${emails.subject} ILIKE ${`%${keyword}%`}`,
        sql`${emails.bodyText} ILIKE ${`%${keyword}%`}`
      )
    );

    // Find matching emails
    const matchingEmails = await db
      .select({
        id: emails.id,
        subject: emails.subject,
        receivedAt: emails.receivedAt,
      })
      .from(emails)
      .where(
        and(
          sql`${emails.accountId} = ANY(${accountIds})`,
          eq(emails.isTrashed, false),
          or(...keywordConditions)
        )
      )
      .limit(100);

    // TODO: Apply label when label system is fully integrated
    // Return the list - frontend/calling code should handle organization
    return {
      success: true,
      organizedCount: matchingEmails.length,
      emailIds: matchingEmails.map((e) => e.id),
    };
  } catch (error) {
    console.error('Error organizing by project:', error);
    return { success: false, error: 'Failed to organize by project' };
  }
}

/**
 * Bulk move emails by category to a target folder
 */
export async function bulkMoveByCategory(
  userId: string,
  category: EmailCategory,
  targetFolder: string
): Promise<{
  success: boolean;
  movedCount?: number;
  emailIds?: string[];
  targetFolder?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const userAccounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
    });

    if (userAccounts.length === 0) {
      return { success: true, movedCount: 0 };
    }

    const accountIds = userAccounts.map((acc) => acc.id);

    // Get emails to move
    const emailsToMove = await db
      .select({
        id: emails.id,
        subject: emails.subject,
        receivedAt: emails.receivedAt,
      })
      .from(emails)
      .where(
        and(
          sql`${emails.accountId} = ANY(${accountIds})`,
          eq(emails.emailCategory, category),
          eq(emails.isTrashed, false)
        )
      )
      .limit(100);

    // Return the list - frontend/calling code should handle moving
    return {
      success: true,
      movedCount: emailsToMove.length,
      emailIds: emailsToMove.map((e) => e.id),
      targetFolder,
    };
  } catch (error) {
    console.error('Error bulk moving by category:', error);
    return { success: false, error: 'Failed to bulk move emails' };
  }
}
