import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { getPlan, type PlanId } from '@/lib/pricing/plans';

const changePlanSchema = z.object({
  planId: z.enum(['free', 'starter', 'professional', 'enterprise']),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { planId } = changePlanSchema.parse(body);

    const plan = getPlan(planId as PlanId);

    // Get current subscription
    const subResult = await db.execute(sql`
      SELECT 
        s.tier,
        s.processor_customer_id,
        s.processor_subscription_id
      FROM subscriptions s
      WHERE s.user_id = ${user.id}
    `);

    const currentSub = subResult.rows[0];

    // Handle downgrade to free
    if (planId === 'free') {
      if (currentSub?.processor_subscription_id) {
        // Cancel Stripe subscription
        await stripe.subscriptions.update(
          currentSub.processor_subscription_id,
          {
            cancel_at_period_end: true,
          }
        );

        return NextResponse.json({
          success: true,
          message: 'Subscription will be canceled at period end',
        });
      }

      // Already free or no subscription
      return NextResponse.json({
        success: true,
        message: 'Already on free plan',
      });
    }

    // Handle upgrade/change (requires Stripe)
    if (!plan.stripePriceId) {
      return NextResponse.json(
        { error: 'Invalid plan configuration' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let customerId = currentSub?.processor_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;

      await db.execute(sql`
        INSERT INTO subscriptions (user_id, processor, processor_customer_id, tier, status)
        VALUES (${user.id}, 'stripe', ${customerId}, 'free', 'active')
        ON CONFLICT (user_id) DO UPDATE SET processor_customer_id = ${customerId}
      `);
    }

    // Create checkout session for new subscription or upgrade
    // Determine the app URL dynamically
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000');

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard/settings/billing?success=true`,
      cancel_url: `${appUrl}/dashboard/settings/billing?canceled=true`,
      metadata: {
        userId: user.id,
        planId,
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error('Error changing plan:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to change plan' },
      { status: 500 }
    );
  }
}
