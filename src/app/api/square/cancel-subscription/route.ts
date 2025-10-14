import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cancelSubscription } from '@/lib/square/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Square subscription ID
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('processor_subscription_id')
      .eq('user_id', user.id)
      .eq('processor', 'square')
      .single();

    if (!subscription?.processor_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 400 }
      );
    }

    await cancelSubscription(subscription.processor_subscription_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
