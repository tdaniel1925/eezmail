import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { webhookSubscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { syncEmailAccount } from '@/lib/settings/email-actions';

/**
 * Microsoft Graph Webhook Endpoint
 * Receives notifications when emails arrive or change
 * 
 * Documentation: https://learn.microsoft.com/en-us/graph/webhooks
 */

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const validationToken = headersList.get('validationtoken');

    // Step 1: Handle subscription validation (first-time setup)
    if (validationToken) {
      console.log('✅ Webhook validation request received');
      // Microsoft expects the validation token to be returned as plain text
      return new Response(validationToken, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Step 2: Handle actual notification
    const body = await request.json();
    console.log('📧 Webhook notification received:', JSON.stringify(body, null, 2));

    // Validate client state (security check)
    const clientState = headersList.get('clientstate');
    const expectedClientState = process.env.WEBHOOK_CLIENT_STATE || 'ImboxWebhookSecret2024';
    
    if (clientState !== expectedClientState) {
      console.error('❌ Invalid client state');
      return NextResponse.json({ error: 'Invalid client state' }, { status: 403 });
    }

    // Process each notification
    const notifications = body.value || [];
    
    for (const notification of notifications) {
      const { subscriptionId, resource, changeType } = notification;
      
      console.log(`📬 Processing notification: ${changeType} for ${resource}`);
      
      // Find the subscription in database
      const subscription = await db.query.webhookSubscriptions.findFirst({
        where: eq(webhookSubscriptions.subscriptionId, subscriptionId),
      });

      if (!subscription) {
        console.error(`❌ Subscription not found: ${subscriptionId}`);
        continue;
      }

      // Trigger immediate sync for this account
      console.log(`🔄 Triggering instant sync for account: ${subscription.accountId}`);
      
      try {
        await syncEmailAccount(subscription.accountId, 'webhook');
        console.log(`✅ Instant sync completed for account: ${subscription.accountId}`);
      } catch (error) {
        console.error('❌ Sync error:', error);
      }
    }

    // Always return 202 Accepted to acknowledge receipt
    return NextResponse.json({ status: 'received' }, { status: 202 });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    // Still return 202 to prevent Microsoft from disabling the webhook
    return NextResponse.json({ status: 'error', message: 'Internal error' }, { status: 202 });
  }
}

// Handle subscription lifecycle notifications
export async function GET() {
  return NextResponse.json({ 
    message: 'Microsoft Graph Webhook Endpoint',
    status: 'active'
  });
}

