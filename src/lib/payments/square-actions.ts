/**
 * Square Payment Integration
 * Alternative to Stripe
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Client, Environment } from 'square';

// Initialize Square client (lazy load)
let squareClient: Client | null = null;
function getSquareClient(): Client {
  if (!squareClient) {
    if (!process.env.SQUARE_ACCESS_TOKEN) {
      throw new Error('SQUARE_ACCESS_TOKEN not configured');
    }
    squareClient = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN!,
      environment:
        process.env.NODE_ENV === 'production'
          ? Environment.Production
          : Environment.Sandbox,
    });
  }
  return squareClient;
}

// ============================================================================
// SQUARE PAYMENTS
// ============================================================================

export async function createSquarePayment(
  amount: number,
  type: 'sms' | 'ai'
): Promise<{
  success: boolean;
  paymentLink?: string;
  orderId?: string;
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
      return { success: false, error: 'Minimum amount is $5.00' };
    }

    const square = getSquareClient();

    // Get or create Square customer
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    let customerId = dbUser?.squareCustomerId;

    if (!customerId) {
      const { result: customer } = await square.customersApi.createCustomer({
        emailAddress: user.email,
        referenceId: user.id,
      });
      customerId = customer.customer?.id;

      if (customerId) {
        await db
          .update(users)
          .set({ squareCustomerId: customerId })
          .where(eq(users.id, user.id));
      }
    }

    // Create order
    const { result: order } = await square.ordersApi.createOrder({
      order: {
        locationId: process.env.SQUARE_LOCATION_ID!,
        customerId,
        lineItems: [
          {
            name: `${type.toUpperCase()} Credits Top-Up`,
            quantity: '1',
            basePriceMoney: {
              amount: BigInt(Math.round(amount * 100)),
              currency: 'USD',
            },
          },
        ],
        metadata: {
          userId: user.id,
          type: type,
          amount: amount.toString(),
        },
      },
      idempotencyKey: `${user.id}-${type}-${Date.now()}`,
    });

    // Create payment link
    const { result: paymentLink } = await square.checkoutApi.createPaymentLink({
      order: {
        locationId: process.env.SQUARE_LOCATION_ID!,
        customerId,
        lineItems: order.order?.lineItems,
      },
      checkoutOptions: {
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&type=${type}&amount=${amount}&processor=square`,
      },
      idempotencyKey: `link-${user.id}-${Date.now()}`,
    });

    console.log(`✅ Created Square payment link for $${amount} ${type} top-up`);

    return {
      success: true,
      paymentLink: paymentLink.paymentLink?.url || undefined,
      orderId: order.order?.id,
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
// SQUARE SUBSCRIPTIONS
// ============================================================================

export async function createSquareSubscription(planId: string): Promise<{
  success: boolean;
  subscriptionId?: string;
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

    // Get subscription plan
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(db.schema.subscriptionPlans.id, planId),
    });

    if (!plan || !plan.isActive) {
      return { success: false, error: 'Invalid or inactive plan' };
    }

    const square = getSquareClient();

    // Get or create Square customer
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    let customerId = dbUser?.squareCustomerId;

    if (!customerId) {
      const { result: customer } = await square.customersApi.createCustomer({
        emailAddress: user.email,
        referenceId: user.id,
      });
      customerId = customer.customer?.id;

      if (customerId) {
        await db
          .update(users)
          .set({ squareCustomerId: customerId })
          .where(eq(users.id, user.id));
      }
    }

    // TODO: Create subscription plan in Square Catalog first
    // Then create subscription
    console.log(`📦 Square subscription requested for plan: ${plan.name}`);

    return {
      success: false,
      error:
        'Square subscriptions require catalog setup. Please use one-time payments for now.',
    };
  } catch (error) {
    console.error('❌ Error creating Square subscription:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
