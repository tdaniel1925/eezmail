import { NextResponse } from 'next/headers';
import { headers } from 'next/headers';
import { Client, Environment } from 'square';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { addBalance } from '@/lib/billing/pricing';
import { addAIBalance } from '@/lib/billing/ai-pricing';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get('x-square-signature');

    if (!signature) {
      console.error('❌ No Square signature found');
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      );
    }

    if (!process.env.SQUARE_WEBHOOK_SIGNATURE_KEY) {
      console.error('❌ SQUARE_WEBHOOK_SIGNATURE_KEY not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    // TODO: Implement signature verification
    // Square uses HMAC SHA-256 with the webhook signature key

    const event = JSON.parse(body);
    console.log(`📦 Square webhook received: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'payment.created':
      case 'payment.updated': {
        const payment = event.data.object.payment;
        if (payment.status === 'COMPLETED') {
          await handlePaymentCompleted(payment);
        }
        break;
      }

      case 'order.updated': {
        const order = event.data.object.order;
        await handleOrderUpdate(order);
        break;
      }

      default:
        console.log(`ℹ️  Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Square webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// ============================================================================
// WEBHOOK HANDLERS
// ============================================================================

async function handlePaymentCompleted(payment: any) {
  try {
    const userId = payment.reference_id || payment.order_id;
    const amount = parseFloat(payment.amount_money.amount) / 100;
    
    // Get metadata from order
    // const type = ...
    // const userId = ...

    console.log(`💰 Square payment completed: $${amount}`);

    // TODO: Get userId and type from order metadata
    // Add balance to user account

    // console.log(`✅ Added $${amount} to user balance`);
  } catch (error) {
    console.error('❌ Error handling payment completed:', error);
  }
}

async function handleOrderUpdate(order: any) {
  try {
    console.log(`📦 Square order updated: ${order.id}, state: ${order.state}`);

    if (order.state === 'COMPLETED') {
      // Extract metadata and process
      const userId = order.metadata?.userId;
      const type = order.metadata?.type as 'sms' | 'ai' | undefined;
      const amount = parseFloat(order.metadata?.amount || '0');

      if (!userId || !type || !amount) {
        console.error('❌ Missing metadata in order');
        return;
      }

      // Add balance
      if (type === 'sms') {
        const result = await addBalance(userId, amount);
        if (result.success) {
          console.log(`✅ Added $${amount} SMS balance to user ${userId}`);
        }
      } else if (type === 'ai') {
        const result = await addAIBalance(userId, 'user', amount);
        if (result.success) {
          console.log(`✅ Added $${amount} AI balance to user ${userId}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error handling order update:', error);
  }
}

