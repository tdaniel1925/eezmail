import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails, emailFolders, emailAccounts } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * DEBUG: Check email folder distribution
 * GET /api/debug/email-folders
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's accounts
    const accounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
    });

    if (accounts.length === 0) {
      return NextResponse.json({
        error: 'No email accounts found',
        accounts: [],
      });
    }

    const accountId = accounts[0].id;

    // Count emails by folder name
    const folderCounts = await db.execute(sql`
      SELECT 
        folder_name, 
        COUNT(*) as count,
        MAX(received_at) as last_email
      FROM emails 
      WHERE user_id = ${user.id}
      GROUP BY folder_name 
      ORDER BY count DESC
    `);

    // Get sent folder specifically
    const sentEmailsCount = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM emails
      WHERE user_id = ${user.id}
      AND LOWER(folder_name) IN ('sent', 'sentitems', 'sent items', 'sent mail')
    `);

    // Get sample sent emails using simpler query
    const sampleSentEmails = await db.query.emails.findMany({
      where: (emails, { eq, and }) =>
        and(eq(emails.userId, user.id), eq(emails.folderName, 'sent')),
      limit: 5,
      columns: {
        id: true,
        subject: true,
        folderName: true,
        fromAddress: true,
        receivedAt: true,
      },
    });

    // Get folders from email_folders table
    const foldersTable = await db.query.emailFolders.findMany({
      where: eq(emailFolders.accountId, accountId),
    });

    // Get total email count
    const totalEmailResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(emails)
      .where(eq(emails.userId, user.id));

    // Get account sync status
    const accountStatus = {
      id: accounts[0].id,
      email: accounts[0].emailAddress,
      syncStatus: accounts[0].syncStatus,
      syncProgress: accounts[0].syncProgress,
      lastSyncAt: accounts[0].lastSyncAt,
      provider: accounts[0].provider,
    };

    const folderCountsArray = folderCounts as any[];
    const sentCountArray = sentEmailsCount as any[];

    return NextResponse.json({
      success: true,
      accountStatus,
      totalFolders: folderCountsArray?.length || 0,
      folderDistribution: folderCountsArray || [],
      sentEmailsCount: sentCountArray?.[0]?.count || 0,
      sampleSentEmails,
      registeredFolders: foldersTable,
      debug: {
        userId: user.id,
        accountId,
        totalEmailsInDb: totalEmailResult[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
