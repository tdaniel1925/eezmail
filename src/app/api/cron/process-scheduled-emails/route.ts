import { NextResponse } from 'next/server';
import { processScheduledEmails } from '@/lib/email/scheduler-actions';

/**
 * Cron job endpoint to process scheduled emails
 * This should be called every minute by a cron service
 *
 * Vercel Cron: Add to vercel.json
 * External cron: Call this endpoint every minute
 */
export async function GET(req: Request) {
  try {
    // Optional: Verify the request is from a trusted source
    // You can add authorization header check here
    const authHeader = req.headers.get('authorization');

    // For Vercel Cron, you might want to check a secret
    // const cronSecret = process.env.CRON_SECRET;
    // if (authHeader !== `Bearer ${cronSecret}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log('[CRON] Processing scheduled emails...');

    const result = await processScheduledEmails();

    if (result.success) {
      console.log(
        `[CRON] Successfully processed ${result.processed || 0} scheduled emails`
      );
      return NextResponse.json({
        success: true,
        processed: result.processed || 0,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error('[CRON] Error processing scheduled emails:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[CRON] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST method for flexibility
export async function POST(req: Request) {
  return GET(req);
}
