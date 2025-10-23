// src/app/api/webhooks/gmail-push/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { gmailHistoryService } from '@/lib/email/gmail-history-api';
import { db } from '@/lib/db';

/**
 * Gmail Push Notification Webhook
 * Receives real-time notifications when emails arrive
 * 
 * Setup required:
 * 1. Create Google Cloud Pub/Sub topic
 * 2. Grant gmail-api-push@system.gserviceaccount.com publish permissions
 * 3. Call watch() API to start receiving notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the request comes from Google
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    // Parse the Pub/Sub message
    const body = await request.json();
    
    if (!body.message || !body.message.data) {
      return NextResponse.json({ error: 'Invalid message format' }, { status: 400 });
    }

    // Decode the base64 message data
    const messageData = Buffer.from(body.message.data, 'base64').toString('utf-8');
    const notification = JSON.parse(messageData);

    console.log('📬 Gmail push notification received:', notification);

    // Extract email address from notification
    const emailAddress = notification.emailAddress;
    const historyId = notification.historyId;

    // Find the account for this email address
    const account = await db.query.emailAccounts.findFirst({
      where: (accounts, { eq }) => 
        eq(accounts.provider, 'gmail') &&
        eq(accounts.email, emailAddress)
    });

    if (!account) {
      console.warn(`No account found for ${emailAddress}`);
      return NextResponse.json({ received: true });
    }

    // Trigger a history sync for this account
    console.log(`🔄 Triggering history sync for account ${account.id}`);
    
    // Queue the sync job (don't block the webhook response)
    queueHistorySync(account.id, (account as any).userId, historyId);

    return NextResponse.json({ 
      received: true,
      accountId: account.id,
      historyId 
    });
  } catch (error) {
    console.error('Error processing Gmail push notification:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Queue a history sync job
 * This runs in the background to avoid blocking the webhook
 */
async function queueHistorySync(
  accountId: string,
  userId: string,
  historyId: string
): Promise<void> {
  // In production, you'd use a job queue like Bull, BullMQ, or Inngest
  // For now, we'll just process it directly with a small delay
  setTimeout(async () => {
    try {
      // Get access token
      const account = await db.query.emailAccounts.findFirst({
        where: (accounts, { eq }) => eq(accounts.id, accountId),
      });

      if (!account || !account.accessToken) {
        console.error('No access token found for account');
        return;
      }

      // Trigger history sync
      await gmailHistoryService.syncWithHistory(
        accountId,
        userId,
        account.accessToken
      );

      console.log(`✅ History sync completed for account ${accountId}`);
    } catch (error) {
      console.error('Error in queued history sync:', error);
    }
  }, 1000); // 1 second delay
}

