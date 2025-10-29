import { NextResponse } from 'next/server';
import { syncAurinkoEmails } from '@/lib/aurinko/sync-service';

/**
 * POST /api/webhooks/aurinko
 * Handles webhook events from Aurinko for real-time email sync
 */
export async function POST(req: Request) {
  try {
    // Get webhook signature for verification
    const signature = req.headers.get('x-aurinko-signature');
    const body = await req.text();

    // TODO: Verify webhook signature using AURINKO_WEBHOOK_SECRET
    // const isValid = verifyAurinkoSignature(body, signature);
    // if (!isValid) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const event = JSON.parse(body);

    console.log('🔵 Aurinko webhook received:', {
      type: event.type,
      accountId: event.accountId,
    });

    // Handle different event types
    switch (event.type) {
      case 'message.received':
      case 'message.updated':
      case 'message.deleted':
        // Trigger sync for the account
        if (event.accountId) {
          // Find our account ID from Aurinko account ID
          const { db } = await import('@/lib/db');
          const { emailAccounts } = await import('@/db/schema');
          const { eq } = await import('drizzle-orm');

          const account = await db.query.emailAccounts.findFirst({
            where: eq(emailAccounts.aurinkoAccountId, event.accountId),
          });

          if (account) {
            await syncAurinkoEmails(account.id);
            console.log(`✅ Synced account ${account.id} via webhook`);
          }
        }
        break;

      default:
        console.log(`⚠️ Unhandled Aurinko webhook event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Error processing Aurinko webhook:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
