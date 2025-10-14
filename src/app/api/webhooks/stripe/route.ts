import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';
import type Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (!userId || !session.customer || !session.subscription) {
          throw new Error('Missing required session data');
        }

        // Update user with Stripe customer ID
        await supabase
          .from('users')
          .update({
            stripe_customer_id: session.customer as string,
            payment_processor: 'stripe',
          })
          .eq('id', userId);

        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        // Find user by customer ID
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', subscription.customer)
          .single();

        if (!user) {
          throw new Error('User not found');
        }

        const priceId = subscription.items.data[0]?.price.id;
        const tier =
          priceId === process.env.STRIPE_PRICE_ID_PRO_MONTHLY
            ? 'pro'
            : priceId === process.env.STRIPE_PRICE_ID_TEAM_MONTHLY
              ? 'team'
              : 'free';

        // Update user subscription status
        await supabase
          .from('users')
          .update({
            subscription_tier: tier,
            subscription_status: subscription.status,
          })
          .eq('id', user.id);

        // Upsert subscription record
        await supabase.from('subscriptions').upsert({
          user_id: user.id,
          tier,
          status: subscription.status,
          processor: 'stripe',
          processor_subscription_id: subscription.id,
          current_period_start: new Date(
            subscription.current_period_start * 1000
          ).toISOString(),
          current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        });

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Find user by customer ID
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', subscription.customer)
          .single();

        if (!user) {
          throw new Error('User not found');
        }

        // Downgrade to free tier
        await supabase
          .from('users')
          .update({
            subscription_tier: 'free',
            subscription_status: 'canceled',
          })
          .eq('id', user.id);

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.customer) {
          const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', invoice.customer)
            .single();

          if (user) {
            await supabase
              .from('users')
              .update({
                subscription_status: 'past_due',
              })
              .eq('id', user.id);
          }
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
