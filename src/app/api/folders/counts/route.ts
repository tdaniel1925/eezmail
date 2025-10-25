import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails, emailAccounts } from '@/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';

// Cache the response for 30 seconds to reduce database load
export const revalidate = 30;

/**
 * Batch API endpoint for folder counts
 * Returns counts for all folders in a single request
 * Replaces 9+ separate API calls with one optimized query
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's account IDs in a subquery for better performance
    const result = await db.execute(sql`
      WITH user_accounts AS (
        SELECT id FROM email_accounts WHERE user_id = ${user.id}
      )
      SELECT
        -- Inbox count (UNREAD only)
        COUNT(*) FILTER (WHERE email_category = 'inbox' AND is_trashed = FALSE AND is_read = FALSE) as inbox_count,
        
        -- Sent emails (TOTAL count - all sent emails)
        COUNT(*) FILTER (WHERE LOWER(folder_name) LIKE '%sent%' AND is_trashed = FALSE) as sent_count,
        
        -- Drafts (TOTAL count)
        COUNT(*) FILTER (WHERE LOWER(folder_name) LIKE '%draft%' AND is_trashed = FALSE) as drafts_count,
        
        -- Starred (UNREAD only)
        COUNT(*) FILTER (WHERE is_starred = TRUE AND is_trashed = FALSE AND is_read = FALSE) as starred_count,
        
        -- Unscreened (UNREAD only)
        COUNT(*) FILTER (WHERE email_category = 'unscreened' AND is_trashed = FALSE AND is_read = FALSE) as unscreened_count,
        
        -- Newsfeed/Feed (UNREAD only)
        COUNT(*) FILTER (WHERE email_category = 'newsfeed' AND is_trashed = FALSE AND is_read = FALSE) as newsfeed_count,
        
        -- Receipts/Paper Trail (UNREAD only)
        COUNT(*) FILTER (WHERE email_category = 'receipts' AND is_trashed = FALSE AND is_read = FALSE) as receipts_count,
        
        -- Spam (UNREAD only)
        COUNT(*) FILTER (WHERE email_category = 'spam' AND is_trashed = FALSE AND is_read = FALSE) as spam_count,
        
        -- Trash (TOTAL count)
        COUNT(*) FILTER (WHERE is_trashed = TRUE) as trash_count,
        
        -- All Mail / Unified Inbox (UNREAD only)
        COUNT(*) FILTER (WHERE is_trashed = FALSE AND is_read = FALSE AND is_draft = FALSE) as all_mail_count,
        
        -- Unread count (for global badge)
        COUNT(*) FILTER (WHERE is_read = FALSE AND is_trashed = FALSE) as unread_count,
        
        -- Reply Queue (emails marked for reply)
        COUNT(*) FILTER (WHERE needs_reply = TRUE AND is_trashed = FALSE) as reply_queue_count
        
      FROM emails
      WHERE account_id IN (SELECT id FROM user_accounts)
    `);

    const counts = result.rows[0] || {};

    // Convert BigInt to numbers for JSON serialization
    const response = {
      inbox: Number(counts.inbox_count || 0),
      sent: Number(counts.sent_count || 0),
      drafts: Number(counts.drafts_count || 0),
      starred: Number(counts.starred_count || 0),
      unscreened: Number(counts.unscreened_count || 0),
      newsfeed: Number(counts.newsfeed_count || 0),
      receipts: Number(counts.receipts_count || 0),
      spam: Number(counts.spam_count || 0),
      trash: Number(counts.trash_count || 0),
      allMail: Number(counts.all_mail_count || 0),
      unread: Number(counts.unread_count || 0),
      replyQueue: Number(counts.reply_queue_count || 0),
    };

    return NextResponse.json(
      {
        success: true,
        counts: response,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    console.error('❌ Error fetching folder counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folder counts' },
      { status: 500 }
    );
  }
}
