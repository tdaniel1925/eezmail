import { NextResponse } from 'next/server';
import { createStripeCheckoutSession } from '@/lib/payments/payment-actions';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { amount, type } = await req.json();

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (!type || !['sms', 'ai'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "sms" or "ai"' },
        { status: 400 }
      );
    }

    const result = await createStripeCheckoutSession(amount, type as 'sms' | 'ai');

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessionId: result.sessionId,
      url: result.url,
    });
  } catch (error) {
    console.error('❌ Error in checkout API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

