/**
 * Email Deduplication & Conflict Resolution
 * Prevents duplicate emails and resolves sync conflicts
 */

'use server';

import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq, and, or, sql } from 'drizzle-orm';
import type { Email } from '@/db/schema';

export interface DuplicateEmail {
  id: string;
  messageId: string;
  nylasMessageId?: string;
  accountId: string;
  subject: string;
  receivedAt: Date;
}

export interface ConflictResolution {
  action: 'keep_first' | 'keep_latest' | 'merge' | 'keep_both';
  reason: string;
}

/**
 * Find duplicate emails by Message-ID
 */
export async function findDuplicates(
  accountId: string,
  messageId: string
): Promise<DuplicateEmail[]> {
  const duplicates = await db
    .select({
      id: emails.id,
      messageId: emails.messageId,
      nylasMessageId: emails.nylasMessageId,
      accountId: emails.accountId,
      subject: emails.subject,
      receivedAt: emails.receivedAt,
    })
    .from(emails)
    .where(
      and(eq(emails.accountId, accountId), eq(emails.messageId, messageId))
    );

  return duplicates as DuplicateEmail[];
}

/**
 * Find duplicates across multiple accounts (same user, different accounts)
 */
export async function findCrossAccountDuplicates(
  userId: string,
  messageId: string
): Promise<DuplicateEmail[]> {
  // This requires a join with emailAccounts table
  const query = sql`
    SELECT 
      e.id,
      e.message_id as "messageId",
      e.nylas_message_id as "nylasMessageId",
      e.account_id as "accountId",
      e.subject,
      e.received_at as "receivedAt"
    FROM emails e
    JOIN email_accounts ea ON e.account_id = ea.id
    WHERE ea.user_id = ${userId}
    AND e.message_id = ${messageId}
  `;

  const result = await db.execute(query);
  return result.rows as DuplicateEmail[];
}

/**
 * Determine conflict resolution strategy
 */
export function resolveConflict(
  existing: Partial<Email>,
  incoming: Partial<Email>
): ConflictResolution {
  // If exact same Nylas message ID, it's truly a duplicate
  if (
    existing.nylasMessageId &&
    existing.nylasMessageId === incoming.nylasMessageId
  ) {
    return {
      action: 'keep_first',
      reason: 'Exact duplicate (same Nylas message ID)',
    };
  }

  // If same Message-ID but different Nylas IDs, check timestamps
  if (
    existing.messageId === incoming.messageId &&
    existing.nylasMessageId !== incoming.nylasMessageId
  ) {
    // Keep the one that was received first
    const existingTime = existing.receivedAt?.getTime() || 0;
    const incomingTime = incoming.receivedAt?.getTime() || 0;

    if (existingTime < incomingTime) {
      return {
        action: 'keep_first',
        reason: 'Existing email received earlier',
      };
    } else {
      return {
        action: 'keep_latest',
        reason: 'Incoming email received earlier',
      };
    }
  }

  // If metadata differs, merge the information
  if (
    existing.isRead !== incoming.isRead ||
    existing.isStarred !== incoming.isStarred
  ) {
    return {
      action: 'merge',
      reason: 'Metadata differs - merge flags',
    };
  }

  // Default: keep first, ignore duplicate
  return {
    action: 'keep_first',
    reason: 'Default deduplication',
  };
}

/**
 * Handle duplicate email during sync
 */
export async function handleDuplicate(
  accountId: string,
  existingId: string,
  incomingData: any
): Promise<{ action: string; updatedId?: string }> {
  // Get existing email
  const [existing] = await db
    .select()
    .from(emails)
    .where(eq(emails.id, existingId))
    .limit(1);

  if (!existing) {
    return { action: 'not_found' };
  }

  // Resolve conflict
  const resolution = resolveConflict(existing, incomingData);

  switch (resolution.action) {
    case 'keep_first':
      // Do nothing, keep existing
      return { action: 'kept_existing', updatedId: existingId };

    case 'keep_latest':
      // Update existing with incoming data
      await db
        .update(emails)
        .set({
          ...incomingData,
          updatedAt: new Date(),
        })
        .where(eq(emails.id, existingId));
      return { action: 'updated', updatedId: existingId };

    case 'merge':
      // Merge metadata (flags)
      await db
        .update(emails)
        .set({
          isRead: incomingData.isRead ?? existing.isRead,
          isStarred: incomingData.isStarred ?? existing.isStarred,
          isImportant: incomingData.isImportant ?? existing.isImportant,
          updatedAt: new Date(),
        })
        .where(eq(emails.id, existingId));
      return { action: 'merged', updatedId: existingId };

    case 'keep_both':
      // Insert as new email (rare case)
      const [newEmail] = await db
        .insert(emails)
        .values(incomingData)
        .returning();
      return { action: 'kept_both', updatedId: newEmail.id };

    default:
      return { action: 'unknown' };
  }
}

/**
 * Deduplicate emails in bulk (cleanup job)
 */
export async function deduplicateEmails(accountId: string): Promise<{
  scanned: number;
  duplicatesFound: number;
  duplicatesRemoved: number;
}> {
  // Find all duplicate message IDs
  const duplicatesQuery = sql<{ messageId: string; count: number }>`
    SELECT message_id as "messageId", COUNT(*) as count
    FROM emails
    WHERE account_id = ${accountId}
    GROUP BY message_id
    HAVING COUNT(*) > 1
  `;

  const duplicates = await db.execute(duplicatesQuery);
  const duplicateMessageIds = duplicates.rows.map((row) => row.messageId);

  let scanned = 0;
  let duplicatesFound = 0;
  let duplicatesRemoved = 0;

  for (const messageId of duplicateMessageIds) {
    scanned++;

    // Get all emails with this message ID
    const dupes = await db
      .select()
      .from(emails)
      .where(
        and(eq(emails.accountId, accountId), eq(emails.messageId, messageId))
      )
      .orderBy(emails.receivedAt);

    if (dupes.length <= 1) continue;

    duplicatesFound += dupes.length - 1;

    // Keep the first (earliest), delete the rest
    const [keep, ...remove] = dupes;

    // Merge metadata from all duplicates
    const mergedFlags = {
      isRead: dupes.some((d) => d.isRead),
      isStarred: dupes.some((d) => d.isStarred),
      isImportant: dupes.some((d) => d.isImportant),
    };

    // Update kept email with merged flags
    await db
      .update(emails)
      .set({
        ...mergedFlags,
        updatedAt: new Date(),
      })
      .where(eq(emails.id, keep.id));

    // Delete duplicates
    for (const dup of remove) {
      await db.delete(emails).where(eq(emails.id, dup.id));
      duplicatesRemoved++;
    }
  }

  return {
    scanned,
    duplicatesFound,
    duplicatesRemoved,
  };
}

/**
 * Check if email exists before inserting
 */
export async function emailExists(
  accountId: string,
  messageId: string,
  nylasMessageId?: string
): Promise<boolean> {
  const conditions = [eq(emails.accountId, accountId)];

  if (nylasMessageId) {
    conditions.push(
      or(
        eq(emails.messageId, messageId),
        eq(emails.nylasMessageId, nylasMessageId)
      )!
    );
  } else {
    conditions.push(eq(emails.messageId, messageId));
  }

  const [existing] = await db
    .select({ id: emails.id })
    .from(emails)
    .where(and(...conditions))
    .limit(1);

  return !!existing;
}

/**
 * Generate unique hash for email content (for fuzzy deduplication)
 */
export function generateEmailHash(email: {
  subject: string;
  fromAddress: any;
  receivedAt: Date;
}): string {
  const normalized = [
    email.subject.trim().toLowerCase(),
    email.fromAddress.email.toLowerCase(),
    Math.floor(email.receivedAt.getTime() / 60000), // Round to minute
  ].join('|');

  // Simple hash (in production, use crypto.createHash)
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(36);
}

/**
 * Find potential fuzzy duplicates (similar subject, sender, time)
 */
export async function findFuzzyDuplicates(
  accountId: string,
  email: {
    subject: string;
    fromAddress: any;
    receivedAt: Date;
  }
): Promise<Email[]> {
  // Find emails with same sender within 1 minute
  const timeLower = new Date(email.receivedAt.getTime() - 60000);
  const timeUpper = new Date(email.receivedAt.getTime() + 60000);

  const query = sql<Email>`
    SELECT *
    FROM emails
    WHERE account_id = ${accountId}
    AND from_address->>'email' = ${email.fromAddress.email}
    AND subject = ${email.subject}
    AND received_at >= ${timeLower}
    AND received_at <= ${timeUpper}
  `;

  const result = await db.execute(query);
  return result.rows as Email[];
}
