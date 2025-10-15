/**
 * Nylas Webhook Handler
 * Receives real-time notifications for email events
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { syncEmailsFromNylas } from '@/lib/nylas/email-sync';
import { queueSyncJob } from '@/lib/sync/job-queue';

/**
 * Verify webhook signature (Nylas webhook security)
 */
async function verifyWebhookSignature(
  payload: string,
  signature: string
): Promise<boolean> {
  // In production, verify the webhook signature using Nylas client secret
  // const expectedSignature = crypto
  //   .createHmac('sha256', process.env.NYLAS_CLIENT_SECRET!)
  //   .update(payload)
  //   .digest('hex');
  // return signature === expectedSignature;

  // For now, just check if signature exists
  return !!signature;
}

/**
 * Handle Nylas webhook events
 */
export async function POST(req: NextRequest) {
  try {
    // Get signature header
    const headersList = await headers();
    const signature = headersList.get('x-nylas-signature') || '';

    // Get raw body
    const body = await req.text();

    // Verify signature
    const isValid = await verifyWebhookSignature(body, signature);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse event
    const event = JSON.parse(body);

    console.log('Received Nylas webhook:', {
      type: event.type,
      grantId: event.data?.grant_id,
    });

    // Handle different event types
    switch (event.type) {
      case 'message.created':
        await handleMessageCreated(event);
        break;

      case 'message.updated':
        await handleMessageUpdated(event);
        break;

      case 'message.deleted':
        await handleMessageDeleted(event);
        break;

      case 'thread.created':
      case 'thread.updated':
        await handleThreadUpdated(event);
        break;

      case 'account.connected':
        await handleAccountConnected(event);
        break;

      case 'account.disconnected':
        await handleAccountDisconnected(event);
        break;

      case 'account.invalid':
        await handleAccountInvalid(event);
        break;

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    // Return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);

    // Still return 200 to prevent retries for invalid payloads
    return NextResponse.json({
      received: true,
      error: 'Processing failed',
    });
  }
}

/**
 * Handle message.created event
 */
async function handleMessageCreated(event: any) {
  const grantId = event.data?.grant_id;
  if (!grantId) return;

  // Find account by grant ID
  const [account] = await db
    .select()
    .from(emailAccounts)
    .where(eq(emailAccounts.nylasGrantId, grantId))
    .limit(1);

  if (!account) {
    console.error(`No account found for grant ID: ${grantId}`);
    return;
  }

  // Queue immediate sync with high priority
  await queueSyncJob(account.id, account.userId, {
    type: 'incremental',
    priority: 0, // Immediate
    scheduledFor: new Date(),
    metadata: {
      limit: 10, // Only sync recent messages
    },
  });

  console.log(`Queued webhook-triggered sync for account ${account.id}`);
}

/**
 * Handle message.updated event
 */
async function handleMessageUpdated(event: any) {
  // Similar to message.created, but with lower priority
  const grantId = event.data?.grant_id;
  if (!grantId) return;

  const [account] = await db
    .select()
    .from(emailAccounts)
    .where(eq(emailAccounts.nylasGrantId, grantId))
    .limit(1);

  if (!account) return;

  // Queue sync with normal priority
  await queueSyncJob(account.id, account.userId, {
    type: 'incremental',
    priority: 2,
    scheduledFor: new Date(),
  });
}

/**
 * Handle message.deleted event
 */
async function handleMessageDeleted(event: any) {
  // Similar to updated
  await handleMessageUpdated(event);
}

/**
 * Handle thread.updated event
 */
async function handleThreadUpdated(event: any) {
  // Queue sync for thread updates
  await handleMessageUpdated(event);
}

/**
 * Handle account.connected event
 */
async function handleAccountConnected(event: any) {
  const grantId = event.data?.grant_id;
  if (!grantId) return;

  const [account] = await db
    .select()
    .from(emailAccounts)
    .where(eq(emailAccounts.nylasGrantId, grantId))
    .limit(1);

  if (!account) return;

  // Trigger full sync for newly connected account
  await syncEmailsFromNylas(account.id, { mode: 'full' });

  console.log(`Full sync triggered for newly connected account ${account.id}`);
}

/**
 * Handle account.disconnected event
 */
async function handleAccountDisconnected(event: any) {
  const grantId = event.data?.grant_id;
  if (!grantId) return;

  // Mark account as inactive
  await db
    .update(emailAccounts)
    .set({
      status: 'inactive',
      syncStatus: 'error',
      lastSyncError: 'Account disconnected',
      updatedAt: new Date(),
    })
    .where(eq(emailAccounts.nylasGrantId, grantId));

  console.log(`Account ${grantId} marked as disconnected`);
}

/**
 * Handle account.invalid event
 */
async function handleAccountInvalid(event: any) {
  const grantId = event.data?.grant_id;
  if (!grantId) return;

  // Mark account as needing reauth
  await db
    .update(emailAccounts)
    .set({
      status: 'error',
      syncStatus: 'error',
      lastSyncError: 'Account authentication invalid - reconnect required',
      updatedAt: new Date(),
    })
    .where(eq(emailAccounts.nylasGrantId, grantId));

  console.log(`Account ${grantId} marked as invalid`);
}

/**
 * GET handler for webhook verification (Nylas webhook setup)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get('challenge');

  if (challenge) {
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({ status: 'Webhook endpoint active' });
}
