import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin/auth';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    // Get the subscription
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, id),
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Update subscription status to canceled
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set({
        status: 'canceled',
        cancelDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id))
      .returning();

    // TODO: If you have Stripe integration, also cancel the subscription in Stripe
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // if (subscription.processorSubscriptionId) {
    //   await stripe.subscriptions.cancel(subscription.processorSubscriptionId);
    // }

    return NextResponse.json(updatedSubscription);
  } catch (error) {
    console.error(`[Admin Subscriptions Cancel ${params.id}] Error:`, error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
