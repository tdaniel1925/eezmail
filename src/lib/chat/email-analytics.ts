'use server';

import { db } from '@/lib/db';
import { emails, emailAccounts } from '@/db/schema';
import { eq, and, sql, desc, gte } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

/**
 * Get overall email statistics for a user
 */
export async function getEmailStatistics(
  userId: string,
  timeRange: 'week' | 'month' | 'year' | 'all' = 'month'
): Promise<{
  success: boolean;
  stats?: {
    totalEmails: number;
    unreadCount: number;
    starredCount: number;
    receivedToday: number;
    averagePerDay: number;
  };
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

    // Get user's accounts
    const userAccounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
    });

    if (userAccounts.length === 0) {
      return {
        success: true,
        stats: {
          totalEmails: 0,
          unreadCount: 0,
          starredCount: 0,
          receivedToday: 0,
          averagePerDay: 0,
        },
      };
    }

    const accountIds = userAccounts.map((acc) => acc.id);

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        startDate.setFullYear(2000); // Far enough back
        break;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Get all stats in parallel
    const [total, unread, starred, today] = await Promise.all([
      // Total emails
      db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(emails)
        .where(
          and(
            sql`${emails.accountId} = ANY(${accountIds})`,
            gte(emails.receivedAt, startDate)
          )
        ),
      // Unread count
      db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(emails)
        .where(
          and(
            sql`${emails.accountId} = ANY(${accountIds})`,
            eq(emails.isRead, false)
          )
        ),
      // Starred count
      db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(emails)
        .where(
          and(
            sql`${emails.accountId} = ANY(${accountIds})`,
            eq(emails.isStarred, true)
          )
        ),
      // Today's emails
      db
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(emails)
        .where(
          and(
            sql`${emails.accountId} = ANY(${accountIds})`,
            gte(emails.receivedAt, todayStart)
          )
        ),
    ]);

    const totalCount = total[0]?.count || 0;
    const days = Math.max(
      1,
      Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    return {
      success: true,
      stats: {
        totalEmails: totalCount,
        unreadCount: unread[0]?.count || 0,
        starredCount: starred[0]?.count || 0,
        receivedToday: today[0]?.count || 0,
        averagePerDay: Math.round(totalCount / days),
      },
    };
  } catch (error) {
    console.error('Error getting email statistics:', error);
    return { success: false, error: 'Failed to get email statistics' };
  }
}

/**
 * Get top senders by email count
 */
export async function getTopSenders(
  userId: string,
  limit: number = 10,
  days: number = 30
): Promise<{
  success: boolean;
  senders?: Array<{ name: string; email: string; count: number }>;
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
      return { success: true, senders: [] };
    }

    const accountIds = userAccounts.map((acc) => acc.id);
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // Use raw SQL for grouping by JSON fields
    const result = await db.execute(sql`
      SELECT 
        from_address->>'name' as sender_name,
        from_address->>'email' as sender_email,
        COUNT(*) as email_count
      FROM emails
      WHERE account_id = ANY(${accountIds})
        AND received_at >= ${sinceDate}
        AND from_address->>'email' IS NOT NULL
      GROUP BY from_address->>'name', from_address->>'email'
      ORDER BY email_count DESC
      LIMIT ${limit}
    `);

    const senders = (result as any[]).map((row: any) => ({
      name: row.sender_name || row.sender_email,
      email: row.sender_email,
      count: parseInt(row.email_count),
    }));

    return { success: true, senders };
  } catch (error) {
    console.error('Error getting top senders:', error);
    return { success: false, error: 'Failed to get top senders' };
  }
}

/**
 * Get email volume by day for charting
 */
export async function getEmailVolumeByDay(
  userId: string,
  days: number = 7
): Promise<{
  success: boolean;
  volume?: Array<{ date: string; count: number }>;
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
      return { success: true, volume: [] };
    }

    const accountIds = userAccounts.map((acc) => acc.id);
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // Get volume by day
    const result = await db.execute(sql`
      SELECT 
        DATE(received_at) as email_date,
        COUNT(*) as email_count
      FROM emails
      WHERE account_id = ANY(${accountIds})
        AND received_at >= ${sinceDate}
      GROUP BY DATE(received_at)
      ORDER BY email_date ASC
    `);

    const volume = (result as any[]).map((row: any) => ({
      date: row.email_date,
      count: parseInt(row.email_count),
    }));

    return { success: true, volume };
  } catch (error) {
    console.error('Error getting email volume:', error);
    return { success: false, error: 'Failed to get email volume' };
  }
}

/**
 * Analyze email patterns
 */
export async function analyzeEmailPatterns(userId: string): Promise<{
  success: boolean;
  patterns?: {
    busiestDayOfWeek: string;
    busiestHourOfDay: number;
    averageResponseTime: string;
    emailDistribution: { category: string; count: number }[];
  };
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
      return {
        success: true,
        patterns: {
          busiestDayOfWeek: 'Monday',
          busiestHourOfDay: 9,
          averageResponseTime: 'No data',
          emailDistribution: [],
        },
      };
    }

    const accountIds = userAccounts.map((acc) => acc.id);

    // Get busiest day of week
    const dayResult = await db.execute(sql`
      SELECT 
        TO_CHAR(received_at, 'Day') as day_name,
        COUNT(*) as email_count
      FROM emails
      WHERE account_id = ANY(${accountIds})
      GROUP BY TO_CHAR(received_at, 'Day'), EXTRACT(DOW FROM received_at)
      ORDER BY email_count DESC
      LIMIT 1
    `);

    // Get busiest hour
    const hourResult = await db.execute(sql`
      SELECT 
        EXTRACT(HOUR FROM received_at) as hour,
        COUNT(*) as email_count
      FROM emails
      WHERE account_id = ANY(${accountIds})
      GROUP BY EXTRACT(HOUR FROM received_at)
      ORDER BY email_count DESC
      LIMIT 1
    `);

    // Get email distribution by category
    const distResult = await db.execute(sql`
      SELECT 
        COALESCE(email_category, 'uncategorized') as category,
        COUNT(*) as email_count
      FROM emails
      WHERE account_id = ANY(${accountIds})
      GROUP BY email_category
      ORDER BY email_count DESC
      LIMIT 5
    `);

    const busiestDay = (dayResult as any[])[0]?.day_name?.trim() || 'Monday';
    const busiestHour = parseInt((hourResult as any[])[0]?.hour || '9');
    const distribution = (distResult as any[]).map((row: any) => ({
      category: row.category,
      count: parseInt(row.email_count),
    }));

    return {
      success: true,
      patterns: {
        busiestDayOfWeek: busiestDay,
        busiestHourOfDay: busiestHour,
        averageResponseTime: '2 hours', // Placeholder - would need sent email tracking
        emailDistribution: distribution,
      },
    };
  } catch (error) {
    console.error('Error analyzing email patterns:', error);
    return { success: false, error: 'Failed to analyze email patterns' };
  }
}
