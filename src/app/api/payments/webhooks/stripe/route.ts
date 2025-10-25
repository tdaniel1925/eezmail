import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { db } from '@/db';
import { users, organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { addBalance } from '@/lib/billing/pricing';
import { addAIBalance } from '@/lib/billing/ai-pricing';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('❌ No Stripe signature found');
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
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
        console.error('❌ Invoice payment failed:', invoice.id);
        // TODO: Send email notification to customer
        break;
      }

      default:
        console.log(`ℹ️  Unhandled event type: ${event.type}`);
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

    console.log(`💰 Processing top-up: $${amount} for ${type} (user: ${userId})`);

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

    console.log(`✅ Subscription updated for user ${user.id}: ${subscription.status}`);

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
    console.log(`✅ Invoice paid: ${invoice.id}, amount: $${(invoice.amount_paid / 100).toFixed(2)}`);

    // TODO: Generate and store PDF invoice
    // TODO: Send invoice email to customer
  } catch (error) {
    console.error('❌ Error handling invoice payment:', error);
  }
}

