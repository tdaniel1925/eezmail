import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { renewAllExpiringSubscriptions } from '@/lib/webhooks/webhook-actions';

/**
 * Webhook Subscription Renewal Cron Job
 *
 * Runs daily to renew webhook subscriptions that are expiring within 24 hours
 * Microsoft Graph subscriptions expire after 3 days (4230 minutes)
 *
 * Configured in vercel.json: 0 0 * * * (daily at midnight UTC)
 * Vercel Cron automatically authenticates - no secret needed!
 */

export async function GET(request: Request) {
  try {
    // Optional: Verify it's from Vercel Cron or allow manual trigger with secret
    const headersList = await headers();
    const authorization = headersList.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Allow Vercel Cron (no auth) or manual trigger with secret
    const isVercelCron = !authorization; // Vercel Cron doesn't send auth header
    const isManualWithAuth =
      cronSecret && authorization === `Bearer ${cronSecret}`;

    if (!isVercelCron && !isManualWithAuth) {
      console.error('❌ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting webhook renewal cron job...');

    const result = await renewAllExpiringSubscriptions();

    console.log('✅ Webhook renewal cron job completed:', result);

    return NextResponse.json({
      success: result.success,
      renewed: result.renewed,
      failed: result.failed,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json(
      {
        error: 'Cron job failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Allow manual trigger via POST (for testing)
export async function POST(request: Request) {
  return GET(request);
}
