import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateProactiveSuggestions } from '@/lib/ai/proactive-suggestions';
import { db } from '@/lib/db';
import { proactiveSuggestions } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Cron endpoint to generate proactive suggestions
 * Should be called every hour via Vercel Cron or external scheduler
 *
 * Vercel cron.json configuration:
 * {
 *   "crons": [{
 *     "path": "/api/cron/proactive-suggestions",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn('❌ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('⏰ Running proactive suggestions cron job...');

    // Get all active users (users who have synced in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeUsersResult = await db.execute(sql`
      SELECT DISTINCT user_id
      FROM email_accounts
      WHERE last_synced_at >= ${sevenDaysAgo.toISOString()}
        AND sync_enabled = true
      LIMIT 100
    `);

    const activeUsers = activeUsersResult.rows.map((row: any) => row.user_id);

    console.log(`📊 Found ${activeUsers.length} active users`);

    let totalSuggestions = 0;

    // Generate suggestions for each user
    for (const userId of activeUsers) {
      try {
        const suggestions = await generateProactiveSuggestions(userId);

        if (suggestions.length > 0) {
          // Store suggestions in database
          // Note: This requires a proactive_suggestions table (we'll create migration if needed)

          // For now, just log them
          console.log(
            `✨ Generated ${suggestions.length} suggestions for user ${userId}`
          );
          totalSuggestions += suggestions.length;

          // TODO: Store in database when table is ready
          // await db.insert(proactiveSuggestions).values(
          //   suggestions.map((s) => ({
          //     userId,
          //     type: s.type,
          //     priority: s.priority,
          //     message: s.message,
          //     action: s.action,
          //     emailId: s.emailId,
          //     metadata: s.metadata,
          //     createdAt: s.createdAt,
          //   }))
          // );
        }
      } catch (error) {
        console.error(
          `Error generating suggestions for user ${userId}:`,
          error
        );
        // Continue with next user
      }
    }

    console.log(
      `✅ Proactive suggestions cron completed. Generated ${totalSuggestions} total suggestions for ${activeUsers.length} users`
    );

    return NextResponse.json({
      success: true,
      usersProcessed: activeUsers.length,
      totalSuggestions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error in proactive suggestions cron:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(
      `🔧 Manual proactive suggestions generation for user ${user.id}`
    );

    const suggestions = await generateProactiveSuggestions(user.id);

    return NextResponse.json({
      success: true,
      suggestions,
      count: suggestions.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
