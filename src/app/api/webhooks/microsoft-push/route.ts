// src/app/api/webhooks/microsoft-push/route.ts
import { NextRequest, NextResponse } from 'next/headers';
import { headers } from 'next/headers';
import { db } from '@/lib/db';

/**
 * Microsoft Graph Webhook Handler
 * Receives notifications for mailbox changes
 * 
 * Setup required:
 * 1. Create subscription via Microsoft Graph API
 * 2. Verify the webhook endpoint
 * 3. Handle notification lifecycle events
 */
export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const validationToken = headersList.get('validationtoken');

    // Microsoft sends a validation request first
    if (validationToken) {
      console.log('📝 Microsoft webhook validation received');
      return new NextResponse(validationToken, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Parse notification
    const body = await request.json();
    const notifications = body.value || [];

    console.log(`📬 Microsoft push notifications received: ${notifications.length}`);

    for (const notification of notifications) {
      const changeType = notification.changeType; // 'created', 'updated', 'deleted'
      const resource = notification.resource; // URL to the changed resource
      const clientState = notification.clientState; // Our custom state
      const subscriptionId = notification.subscriptionId;

      // Extract account ID from clientState
      const accountId = clientState;

      if (!accountId) {
        console.warn('No account ID in notification');
        continue;
      }

      // Get account
      const account = await db.query.emailAccounts.findFirst({
        where: (accounts, { eq }) => eq(accounts.id, accountId),
      });

      if (!account) {
        console.warn(`No account found for ${accountId}`);
        continue;
      }

      // Queue sync for this account
      console.log(`🔄 Triggering sync for account ${accountId} (${changeType})`);
      queueMicrosoftSync(accountId, (account as any).userId, changeType);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing Microsoft push notification:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Queue a Microsoft Graph sync job
 */
async function queueMicrosoftSync(
  accountId: string,
  userId: string,
  changeType: string
): Promise<void> {
  // Queue the sync with a small delay
  setTimeout(async () => {
    try {
      // Import sync service
      const { syncEmailAccount } = await import('@/lib/sync/email-sync-service');

      await syncEmailAccount(accountId, userId, 'auto');

      console.log(`✅ Microsoft sync completed for account ${accountId}`);
    } catch (error) {
      console.error('Error in queued Microsoft sync:', error);
    }
  }, 2000); // 2 second delay to batch rapid changes
}

/**
 * Renew Microsoft Graph subscription
 * Subscriptions expire after 3 days, so we need to renew them
 */
export async function renewMicrosoftSubscription(
  accountId: string,
  accessToken: string,
  subscriptionId: string
): Promise<void> {
  try {
    // Extend expiration by 3 days
    const expirationDateTime = new Date();
    expirationDateTime.setDate(expirationDateTime.getDate() + 3);

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/subscriptions/${subscriptionId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          expirationDateTime: expirationDateTime.toISOString(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to renew subscription: ${response.statusText}`);
    }

    console.log(`✅ Microsoft subscription renewed for account ${accountId}`);
  } catch (error) {
    console.error('Error renewing Microsoft subscription:', error);
    throw error;
  }
}

