import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { db } from '@/db';
import { users, organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { addBalance } from '@/lib/billing/pricing';
import { addAIBalance } from '@/lib/billing/ai-pricing';
import {
  sendPaymentFailedEmail,
  sendFinalPaymentWarningEmail,
} from '@/lib/email/dunning';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Allow build without Stripe key (will fail at runtime if actually used)
const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key_for_build',
  {
    apiVersion: '2024-11-20.acacia',
  }
);

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('❌ No Stripe signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`📦 Stripe webhook received: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePayment(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// ============================================================================
// WEBHOOK HANDLERS
// ============================================================================

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const userId = session.metadata?.userId;
    const type = session.metadata?.type as 'sms' | 'ai' | undefined;
    const amount = parseFloat(session.metadata?.amount || '0');

    if (!userId) {
      console.error('❌ No userId in session metadata');
      return;
    }

    // Check if this is a subscription or one-time payment
    if (session.mode === 'subscription') {
      console.log(`✅ Subscription checkout completed for user ${userId}`);
      // Subscription will be handled by customer.subscription.created event
      return;
    }

    // One-time payment (top-up)
    if (!type || !amount) {
      console.error('❌ Missing type or amount in session metadata');
      return;
    }

    console.log(
      `💰 Processing top-up: $${amount} for ${type} (user: ${userId})`
    );

    // Add balance to user account
    if (type === 'sms') {
      const result = await addBalance(userId, amount);
      if (result.success) {
        console.log(`✅ Added $${amount} SMS balance to user ${userId}`);
      } else {
        console.error(`❌ Failed to add SMS balance: ${result.error}`);
      }
    } else if (type === 'ai') {
      const result = await addAIBalance(userId, 'user', amount);
      if (result.success) {
        console.log(`✅ Added $${amount} AI balance to user ${userId}`);
      } else {
        console.error(`❌ Failed to add AI balance: ${result.error}`);
      }
    }

    // TODO: Send confirmation email
    // TODO: Log transaction in database
  } catch (error) {
    console.error('❌ Error handling checkout completed:', error);
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;

    // Find user by Stripe customer ID
    const user = await db.query.users.findFirst({
      where: eq(users.stripeCustomerId, customerId),
    });

    if (!user) {
      console.error(`❌ No user found for Stripe customer ${customerId}`);
      return;
    }

    console.log(
      `✅ Subscription updated for user ${user.id}: ${subscription.status}`
    );

    // TODO: Update customer_subscriptions table
    // TODO: Reset SMS/AI usage counters if new period
  } catch (error) {
    console.error('❌ Error handling subscription update:', error);
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;

    const user = await db.query.users.findFirst({
      where: eq(users.stripeCustomerId, customerId),
    });

    if (!user) {
      console.error(`❌ No user found for Stripe customer ${customerId}`);
      return;
    }

    console.log(`⚠️  Subscription canceled for user ${user.id}`);

    // TODO: Update customer_subscriptions table status to 'canceled'
    // TODO: Send cancellation confirmation email
  } catch (error) {
    console.error('❌ Error handling subscription canceled:', error);
  }
}

async function handleInvoicePayment(invoice: Stripe.Invoice) {
  try {
    console.log(
      `✅ Invoice paid: ${invoice.id}, amount: $${(invoice.amount_paid / 100).toFixed(2)}`
    );

    // TODO: Generate and store PDF invoice
    // TODO: Send invoice email to customer
  } catch (error) {
    console.error('❌ Error handling invoice payment:', error);
  }
}

/**
 * Handle invoice payment failed
 * Sends dunning emails based on attempt count
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const customerId = invoice.customer as string;
    const attemptCount = invoice.attempt_count || 0;

    console.error(
      `❌ Invoice payment failed: ${invoice.id}, attempt: ${attemptCount}`
    );

    // Get user from Stripe customer ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId))
      .limit(1);

    if (!user) {
      console.warn('⚠️  Payment failed for unknown customer:', customerId);
      return;
    }

    console.log(
      `💳 Payment failed for user ${user.email}, attempt ${attemptCount}`
    );

    // Send dunning email based on attempt number
    if (attemptCount === 1) {
      // First failure - friendly reminder
      const nextRetryDate = invoice.next_payment_attempt
        ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString()
        : 'in 3 days';

      await sendPaymentFailedEmail(user.email, {
        customerName: user.firstName || user.name || 'there',
        amount: (invoice.amount_due / 100).toFixed(2),
        nextRetryDate,
        updatePaymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?update=true`,
      });

      console.log(`📧 Sent payment failed email (attempt 1) to ${user.email}`);
    } else if (attemptCount >= 3) {
      // Final warning before cancellation
      await sendFinalPaymentWarningEmail(user.email, {
        customerName: user.firstName || user.name || 'there',
        amount: (invoice.amount_due / 100).toFixed(2),
      });

      console.log(
        `📧 Sent final payment warning (attempt ${attemptCount}) to ${user.email}`
      );
    }
  } catch (error) {
    console.error('❌ Error handling invoice payment failed:', error);
  }
}
