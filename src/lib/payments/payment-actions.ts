/**
 * Payment Integration Actions
 * Stripe and Square payment processing
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { users, organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

// Initialize Stripe (lazy load)
let stripeClient: Stripe | null = null;
function getStripeClient(): Stripe {
  if (!stripeClient) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });
  }
  return stripeClient;
}

// ============================================================================
// STRIPE CHECKOUT - TOP UP BALANCE
// ============================================================================

export async function createStripeCheckoutSession(
  amount: number,
  type: 'sms' | 'ai'
): Promise<{
  success: boolean;
  sessionId?: string;
  url?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Minimum $5
    if (amount < 5) {
      return { success: false, error: 'Minimum top-up amount is $5.00' };
    }

    const stripe = getStripeClient();

    // Get or create Stripe customer
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    let customerId = dbUser?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID
      await db
        .update(users)
        .set({ stripeCustomerId: customerId })
        .where(eq(users.id, user.id));
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${type.toUpperCase()} Credits Top-Up`,
              description: `Add $${amount.toFixed(2)} to your ${type.toUpperCase()} balance`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&type=${type}&amount=${amount}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
      metadata: {
        userId: user.id,
        type: type, // 'sms' or 'ai'
        amount: amount.toString(),
      },
    });

    console.log(`✅ Created Stripe checkout session for $${amount} ${type} top-up`);

    return {
      success: true,
      sessionId: session.id,
      url: session.url || undefined,
    };
  } catch (error) {
    console.error('❌ Error creating Stripe checkout:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

export async function createStripeSubscription(
  planId: string
): Promise<{
  success: boolean;
  sessionId?: string;
  url?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get subscription plan from database
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(db.schema.subscriptionPlans.id, planId),
    });

    if (!plan || !plan.isActive) {
      return { success: false, error: 'Invalid or inactive plan' };
    }

    const stripe = getStripeClient();

    // Get or create Stripe customer
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    let customerId = dbUser?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      await db
        .update(users)
        .set({ stripeCustomerId: customerId })
        .where(eq(users.id, user.id));
    }

    // Create or get Stripe price
    // TODO: Create prices in Stripe dashboard and store price IDs in database
    // For now, create price on-the-fly
    const price = await stripe.prices.create({
      currency: 'usd',
      unit_amount: Math.round(Number(plan.monthlyPrice) * 100),
      recurring: { interval: 'month' },
      product_data: {
        name: plan.name,
        description: `Includes ${plan.smsIncluded} SMS and ${plan.aiTokensIncluded} AI tokens per month`,
      },
    });

    // Create checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&subscription=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/plans?canceled=true`,
      metadata: {
        userId: user.id,
        planId: planId,
      },
    });

    console.log(`✅ Created Stripe subscription session for plan: ${plan.name}`);

    return {
      success: true,
      sessionId: session.id,
      url: session.url || undefined,
    };
  } catch (error) {
    console.error('❌ Error creating Stripe subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// SQUARE PAYMENTS (Alternative)
// ============================================================================

export async function createSquarePayment(
  amount: number,
  type: 'sms' | 'ai'
): Promise<{
  success: boolean;
  paymentUrl?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    if (amount < 5) {
      return { success: false, error: 'Minimum top-up amount is $5.00' };
    }

    // TODO: Implement Square SDK integration
    // For now, return placeholder
    console.log(`📦 Square payment requested: $${amount} for ${type}`);

    return {
      success: false,
      error: 'Square integration not yet implemented. Please use Stripe.',
    };
  } catch (error) {
    console.error('❌ Error creating Square payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// TRANSACTION HISTORY
// ============================================================================

export async function getPaymentHistory(): Promise<{
  success: boolean;
  transactions?: Array<{
    id: string;
    type: 'top_up' | 'subscription' | 'refund';
    amount: number;
    status: string;
    processor: 'stripe' | 'square';
    createdAt: Date;
    description: string;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // TODO: Query payment transactions from database
    // For now, return empty array
    return {
      success: true,
      transactions: [],
    };
  } catch (error) {
    console.error('❌ Error getting payment history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

