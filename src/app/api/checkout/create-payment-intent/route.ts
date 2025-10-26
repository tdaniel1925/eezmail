/**
 * Checkout Payment Intent API
 * POST /api/checkout/create-payment-intent
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { convertCartToOrder } from '@/lib/ecommerce/cart';
import Stripe from 'stripe';
import { z } from 'zod';

// Initialize Stripe lazily to avoid build-time errors
let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });
  }
  return stripe;
}

const createPaymentIntentSchema = z.object({
  cartId: z.string().uuid(),
  billingInfo: z.object({
    name: z.string(),
    email: z.string().email(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { cartId, billingInfo } = createPaymentIntentSchema.parse(body);

    // Convert cart to order
    const orderId = await convertCartToOrder(cartId, user.id);

    // Get order details
    const { db } = await import('@/db');
    const { orders } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    // Create Stripe payment intent
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(order.totalAmount) * 100),
      currency: 'usd',
      metadata: {
        orderId,
        userId: user.id,
      },
      receipt_email: billingInfo.email,
    });

    // Update order with payment intent
    await db
      .update(orders)
      .set({
        stripePaymentIntentId: paymentIntent.id,
        paymentProcessor: 'stripe',
      })
      .where(eq(orders.id, orderId));

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId,
    });
  } catch (error) {
    console.error('[Payment Intent] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
