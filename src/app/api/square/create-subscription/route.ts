import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSubscription, createCustomer } from '@/lib/square/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await req.json();

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }

    // Get or create Square customer
    const { data: userData } = await supabase
      .from('users')
      .select('square_customer_id, full_name')
      .eq('id', user.id)
      .single();

    let customerId = userData?.square_customer_id;

    if (!customerId) {
      // Create Square customer
      const [givenName, ...familyNameParts] =
        userData?.full_name?.split(' ') || [];
      const familyName = familyNameParts.join(' ');

      const customer = await createCustomer({
        email: user.email!,
        givenName,
        familyName,
      });

      customerId = customer?.id;

      if (!customerId) {
        throw new Error('Failed to create customer');
      }

      // Update user with Square customer ID
      await supabase
        .from('users')
        .update({
          square_customer_id: customerId,
          payment_processor: 'square',
        })
        .eq('id', user.id);
    }

    // Create subscription
    const subscription = await createSubscription({
      customerId,
      planId,
      locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
