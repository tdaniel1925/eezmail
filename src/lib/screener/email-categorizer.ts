'use server';

import { db } from '@/lib/db';
import { senderTrust } from '@/db/schema';
import { isReceipt, isLikelySpam, Email } from './email-utils';

export type EmailCategory =
  | 'unscreened'
  | 'inbox'
  | 'newsfeed'
  | 'receipts'
  | 'spam'
  | 'archived';

export interface SenderTrustData {
  trustLevel: 'trusted' | 'unknown' | 'spam';
}

/**
 * Categorize incoming email based on content and sender trust
 */
export async function categorizeIncomingEmail(
  email: Email,
  userId: string
): Promise<EmailCategory> {
  // Check receipts first (financial keywords)
  if (isReceipt(email)) return 'receipts';

  // Get sender trust level
  const senderTrustData = await getSenderTrust(email.fromAddress.email, userId);

  // Trusted senders go straight to inbox
  if (senderTrustData?.trustLevel === 'trusted') return 'inbox';

  // Known spam senders
  if (senderTrustData?.trustLevel === 'spam') return 'spam';

  // New senders or suspected spam go to screener
  if (!senderTrustData || isLikelySpam(email)) return 'unscreened';

  // Default to inbox for known senders
  return 'inbox';
}

/**
 * Get sender trust level from database
 */
async function getSenderTrust(
  senderEmail: string,
  userId: string
): Promise<SenderTrustData | null> {
  try {
    const trust = await db.query.senderTrust.findFirst({
      where: (trust, { and, eq }) =>
        and(eq(trust.senderEmail, senderEmail), eq(trust.userId, userId)),
    });

    return trust ? { trustLevel: trust.trustLevel } : null;
  } catch (error) {
    console.error('Error fetching sender trust:', error);
    return null;
  }
}

/**
 * Update sender trust level
 */
export async function updateSenderTrust(
  senderEmail: string,
  userId: string,
  trustLevel: 'trusted' | 'unknown' | 'spam'
): Promise<void> {
  try {
    await db
      .insert(senderTrust)
      .values({
        userId,
        senderEmail,
        trustLevel,
      })
      .onConflictDoUpdate({
        target: [senderTrust.userId, senderTrust.senderEmail],
        set: {
          trustLevel,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error('Error updating sender trust:', error);
  }
}
