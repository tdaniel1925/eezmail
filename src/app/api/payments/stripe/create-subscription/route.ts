import { NextResponse } from 'next/server';
import { createStripeSubscription } from '@/lib/payments/payment-actions';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { planId } = await req.json();

    if (!planId || typeof planId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid planId' },
        { status: 400 }
      );
    }

    const result = await createStripeSubscription(planId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessionId: result.sessionId,
      url: result.url,
    });
  } catch (error) {
    console.error('❌ Error in subscription API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

