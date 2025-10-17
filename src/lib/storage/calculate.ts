'use server';

import { db } from '@/lib/db';
import { emails, emailAttachments, emailAccounts } from '@/db/schema';
import { eq, sql, and, inArray } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { formatBytes } from './utils';

/**
 * Helper to get user's account IDs
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
 * Calculate total storage used by a user
 * Includes email body size and all attachment sizes
 */
export async function calculateStorageUsed(userId: string): Promise<{
  success: boolean;
  bytesUsed?: number;
  formatted?: string;
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

    // Get user's account IDs
    const accountIds = await getUserAccountIds();
    if (accountIds.length === 0) {
      return { success: true, bytesUsed: 0, formatted: '0 Bytes' };
    }

    // Calculate email body sizes
    // Approximate: 1 character ≈ 1 byte for text
    const emailSizes = await db
      .select({
        totalSize: sql<number>`COALESCE(SUM(LENGTH(COALESCE(${emails.bodyText}, '')) + LENGTH(COALESCE(${emails.bodyHtml}, '')) + LENGTH(COALESCE(${emails.subject}, '')) + LENGTH(COALESCE(${emails.snippet}, ''))), 0)`,
      })
      .from(emails)
      .where(inArray(emails.accountId, accountIds));

    const emailBytes = Number(emailSizes[0]?.totalSize || 0);

    // Calculate attachment sizes
    const attachmentSizes = await db
      .select({
        totalSize: sql<number>`COALESCE(SUM(${emailAttachments.size}), 0)`,
      })
      .from(emailAttachments)
      .innerJoin(emails, eq(emailAttachments.emailId, emails.id))
      .where(inArray(emails.accountId, accountIds));

    const attachmentBytes = Number(attachmentSizes[0]?.totalSize || 0);

    const totalBytes = emailBytes + attachmentBytes;

    return {
      success: true,
      bytesUsed: totalBytes,
      formatted: formatBytes(totalBytes),
    };
  } catch (error) {
    console.error('Error calculating storage:', error);
    return { success: false, error: 'Failed to calculate storage' };
  }
}

/**
 * Get storage quota for a user based on their subscription tier
 */
export async function getStorageQuota(userId: string): Promise<{
  success: boolean;
  bytesQuota?: number;
  formatted?: string;
  tier?: string;
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

    // TODO: Get user's subscription tier from database
    // For now, default to free tier: 15 GB
    const tierQuotas: Record<string, number> = {
      free: 15 * 1024 * 1024 * 1024, // 15 GB
      pro: 100 * 1024 * 1024 * 1024, // 100 GB
      business: 1024 * 1024 * 1024 * 1024, // 1 TB
    };

    const tier = 'free'; // TODO: Get from user's subscription
    const bytesQuota = tierQuotas[tier];

    return {
      success: true,
      bytesQuota,
      formatted: formatBytes(bytesQuota),
      tier,
    };
  } catch (error) {
    console.error('Error getting storage quota:', error);
    return { success: false, error: 'Failed to get storage quota' };
  }
}

/**
 * Get complete storage information for a user
 */
export async function getStorageInfo(userId: string): Promise<{
  success: boolean;
  used?: number;
  quota?: number;
  usedFormatted?: string;
  quotaFormatted?: string;
  percentUsed?: number;
  tier?: string;
  error?: string;
}> {
  try {
    const [usedResult, quotaResult] = await Promise.all([
      calculateStorageUsed(userId),
      getStorageQuota(userId),
    ]);

    if (!usedResult.success || !quotaResult.success) {
      return {
        success: false,
        error:
          usedResult.error || quotaResult.error || 'Failed to get storage info',
      };
    }

    const used = usedResult.bytesUsed || 0;
    const quota = quotaResult.bytesQuota || 1;
    const percentUsed = Math.round((used / quota) * 100);

    return {
      success: true,
      used,
      quota,
      usedFormatted: formatBytes(used),
      quotaFormatted: formatBytes(quota),
      percentUsed,
      tier: quotaResult.tier,
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return { success: false, error: 'Failed to get storage info' };
  }
}

/**
 * Check if user is approaching storage limit
 */
export async function checkStorageWarning(userId: string): Promise<{
  success: boolean;
  warning?: 'none' | 'approaching' | 'critical' | 'exceeded';
  percentUsed?: number;
  message?: string;
  error?: string;
}> {
  try {
    const storageInfo = await getStorageInfo(userId);

    if (!storageInfo.success || storageInfo.percentUsed === undefined) {
      return { success: false, error: 'Failed to check storage' };
    }

    const percent = storageInfo.percentUsed;

    let warning: 'none' | 'approaching' | 'critical' | 'exceeded' = 'none';
    let message = '';

    if (percent >= 100) {
      warning = 'exceeded';
      message =
        'Storage limit exceeded! Please delete emails or upgrade your plan.';
    } else if (percent >= 90) {
      warning = 'critical';
      message = `Storage ${percent}% full. Consider deleting old emails or upgrading.`;
    } else if (percent >= 75) {
      warning = 'approaching';
      message = `Storage ${percent}% full. You may want to free up space soon.`;
    }

    return {
      success: true,
      warning,
      percentUsed: percent,
      message,
    };
  } catch (error) {
    console.error('Error checking storage warning:', error);
    return { success: false, error: 'Failed to check storage' };
  }
}
