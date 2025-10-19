'use server';

/**
 * Microsoft Graph Webhook Subscription Management
 * Handles creation, renewal, and deletion of webhook subscriptions
 */

import { db } from '@/lib/db';
import { webhookSubscriptions, emailAccounts } from '@/db/schema';
import { eq, lt } from 'drizzle-orm';

interface SubscribeToWebhookParams {
  accountId: string;
  accessToken: string;
}

interface SubscribeToWebhookResult {
  success: boolean;
  subscriptionId?: string;
  expiresAt?: Date;
  error?: string;
}

/**
 * Subscribe to Microsoft Graph webhook notifications for an email account
 */
export async function subscribeToWebhook(
  params: SubscribeToWebhookParams
): Promise<SubscribeToWebhookResult> {
  try {
    const { accountId, accessToken } = params;

    // Get account details
    const account = await db.query.emailAccounts.findFirst({
      where: eq(emailAccounts.id, accountId),
    });

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Check if subscription already exists
    const existingSubscription = await db.query.webhookSubscriptions.findFirst({
      where: eq(webhookSubscriptions.accountId, accountId),
    });

    if (existingSubscription && existingSubscription.isActive) {
      // Renew existing subscription
      return await renewWebhookSubscription(existingSubscription.subscriptionId, accessToken);
    }

    // Create new subscription
    const clientState = process.env.WEBHOOK_CLIENT_STATE || 'ImboxWebhookSecret2024';
    const webhookUrl = process.env.WEBHOOK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/microsoft`;

    // Calculate expiration (max 4230 minutes = ~3 days for Microsoft Graph)
    const expirationDateTime = new Date(Date.now() + 4230 * 60000);

    const subscriptionPayload = {
      changeType: 'created,updated',
      notificationUrl: webhookUrl,
      resource: '/me/mailFolders/inbox/messages',
      expirationDateTime: expirationDateTime.toISOString(),
      clientState: clientState,
    };

    console.log('📧 Creating webhook subscription:', subscriptionPayload);

    const response = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionPayload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Failed to create subscription:', error);
      return {
        success: false,
        error: `Failed to create subscription: ${error.error?.message || response.statusText}`,
      };
    }

    const subscription = await response.json();
    console.log('✅ Webhook subscription created:', subscription.id);

    // Save subscription to database
    await db.insert(webhookSubscriptions).values({
      accountId: accountId,
      subscriptionId: subscription.id,
      resource: subscription.resource,
      changeType: subscription.changeType,
      notificationUrl: subscription.notificationUrl,
      clientState: clientState,
      expirationDateTime: new Date(subscription.expirationDateTime),
      isActive: true,
      lastRenewedAt: new Date(),
    });

    return {
      success: true,
      subscriptionId: subscription.id,
      expiresAt: new Date(subscription.expirationDateTime),
    };
  } catch (error) {
    console.error('❌ Subscribe to webhook error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Renew an existing webhook subscription (must be done before it expires)
 */
export async function renewWebhookSubscription(
  subscriptionId: string,
  accessToken: string
): Promise<SubscribeToWebhookResult> {
  try {
    // Calculate new expiration (max 4230 minutes = ~3 days)
    const expirationDateTime = new Date(Date.now() + 4230 * 60000);

    console.log('🔄 Renewing webhook subscription:', subscriptionId);

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
      const error = await response.json();
      console.error('❌ Failed to renew subscription:', error);
      
      // If subscription doesn't exist, mark it as inactive
      if (response.status === 404) {
        await db
          .update(webhookSubscriptions)
          .set({ isActive: false })
          .where(eq(webhookSubscriptions.subscriptionId, subscriptionId));
      }
      
      return {
        success: false,
        error: `Failed to renew subscription: ${error.error?.message || response.statusText}`,
      };
    }

    const subscription = await response.json();
    console.log('✅ Webhook subscription renewed:', subscription.id);

    // Update database
    await db
      .update(webhookSubscriptions)
      .set({
        expirationDateTime: new Date(subscription.expirationDateTime),
        lastRenewedAt: new Date(),
        isActive: true,
      })
      .where(eq(webhookSubscriptions.subscriptionId, subscriptionId));

    return {
      success: true,
      subscriptionId: subscription.id,
      expiresAt: new Date(subscription.expirationDateTime),
    };
  } catch (error) {
    console.error('❌ Renew webhook error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a webhook subscription
 */
export async function deleteWebhookSubscription(
  subscriptionId: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🗑️  Deleting webhook subscription:', subscriptionId);

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/subscriptions/${subscriptionId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const error = await response.json();
      console.error('❌ Failed to delete subscription:', error);
      return {
        success: false,
        error: `Failed to delete subscription: ${error.error?.message || response.statusText}`,
      };
    }

    console.log('✅ Webhook subscription deleted:', subscriptionId);

    // Remove from database
    await db
      .delete(webhookSubscriptions)
      .where(eq(webhookSubscriptions.subscriptionId, subscriptionId));

    return { success: true };
  } catch (error) {
    console.error('❌ Delete webhook error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all subscriptions that need renewal (expiring within 24 hours)
 */
export async function getSubscriptionsNeedingRenewal(): Promise<Array<{
  id: string;
  subscriptionId: string;
  accountId: string;
  expirationDateTime: Date;
}>> {
  try {
    const expirationThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    const subscriptions = await db.query.webhookSubscriptions.findMany({
      where: eq(webhookSubscriptions.isActive, true),
    });

    // Filter subscriptions expiring within 24 hours
    return subscriptions.filter(
      (sub) => new Date(sub.expirationDateTime) < expirationThreshold
    );
  } catch (error) {
    console.error('❌ Error getting subscriptions needing renewal:', error);
    return [];
  }
}

/**
 * Renew all expiring subscriptions (run this via cron job)
 */
export async function renewAllExpiringSubscriptions(): Promise<{
  success: boolean;
  renewed: number;
  failed: number;
  errors: string[];
}> {
  try {
    console.log('🔄 Starting subscription renewal job...');

    const subscriptionsToRenew = await getSubscriptionsNeedingRenewal();
    console.log(`📋 Found ${subscriptionsToRenew.length} subscriptions to renew`);

    let renewed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const subscription of subscriptionsToRenew) {
      try {
        // Get account to fetch access token
        const account = await db.query.emailAccounts.findFirst({
          where: eq(emailAccounts.id, subscription.accountId),
        });

        if (!account || !account.accessToken) {
          errors.push(`No access token for subscription ${subscription.subscriptionId}`);
          failed++;
          continue;
        }

        const result = await renewWebhookSubscription(
          subscription.subscriptionId,
          account.accessToken
        );

        if (result.success) {
          renewed++;
          console.log(`✅ Renewed subscription ${subscription.subscriptionId}`);
        } else {
          failed++;
          errors.push(`Failed to renew ${subscription.subscriptionId}: ${result.error}`);
        }
      } catch (error) {
        failed++;
        errors.push(`Error renewing ${subscription.subscriptionId}: ${error}`);
      }
    }

    console.log(`✅ Renewal job complete: ${renewed} renewed, ${failed} failed`);

    return {
      success: true,
      renewed,
      failed,
      errors,
    };
  } catch (error) {
    console.error('❌ Renewal job error:', error);
    return {
      success: false,
      renewed: 0,
      failed: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

