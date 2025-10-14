import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

function isValidWebhookSignature(body: string, signature: string): boolean {
  if (!process.env.SQUARE_WEBHOOK_SIGNATURE_KEY) {
    throw new Error('SQUARE_WEBHOOK_SIGNATURE_KEY is not set');
  }

  const hmac = crypto.createHmac(
    'sha256',
    process.env.SQUARE_WEBHOOK_SIGNATURE_KEY
  );
  hmac.update(body);
  const hash = hmac.digest('base64');

  return hash === signature;
}

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('x-square-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  if (!isValidWebhookSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(body);
  const supabase = await createClient();

  try {
    switch (event.type) {
      case 'subscription.created':
      case 'subscription.updated': {
        const subscription = event.data.object.subscription;
        const customerId = subscription.customer_id;

        // Find user by Square customer ID
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('square_customer_id', customerId)
          .single();

        if (!user) {
          throw new Error('User not found');
        }

        const planId = subscription.plan_variation_id;
        const tier =
          planId === process.env.SQUARE_PLAN_ID_PRO_MONTHLY
            ? 'pro'
            : planId === process.env.SQUARE_PLAN_ID_TEAM_MONTHLY
              ? 'team'
              : 'free';

        // Update user subscription status
        await supabase
          .from('users')
          .update({
            subscription_tier: tier,
            subscription_status: subscription.status.toLowerCase(),
          })
          .eq('id', user.id);

        // Upsert subscription record
        await supabase.from('subscriptions').upsert({
          user_id: user.id,
          tier,
          status: subscription.status.toLowerCase(),
          processor: 'square',
          processor_subscription_id: subscription.id,
          current_period_start: subscription.charged_through_date,
          current_period_end: subscription.charged_through_date,
          cancel_at_period_end: subscription.status === 'PENDING',
        });

        break;
      }

      case 'subscription.canceled': {
        const subscription = event.data.object.subscription;
        const customerId = subscription.customer_id;

        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('square_customer_id', customerId)
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

      default:
        console.log(`Unhandled Square event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing Square webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
