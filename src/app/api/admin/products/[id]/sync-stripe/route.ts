/**
 * Sync Product to Stripe API Route
 * POST /api/admin/products/[id]/sync-stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncProductToStripe } from '@/lib/stripe/product-sync';
import { auditServerAction } from '@/lib/audit/middleware';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'super_admin' && userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Sync product to Stripe
    const result = await syncProductToStripe(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to sync product' },
        { status: 400 }
      );
    }

    // Audit log
    await auditServerAction('update', 'product', {
      userId: user.id,
      userEmail: userData.email,
      resourceId: id,
      metadata: {
        action: 'stripe_sync',
        stripeProductId: result.stripeProductId,
        stripePriceId: result.stripePriceId,
      },
    });

    return NextResponse.json({
      success: true,
      stripeProductId: result.stripeProductId,
      stripePriceId: result.stripePriceId,
    });
  } catch (error) {
    console.error('[Stripe Sync API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to sync product to Stripe' },
      { status: 500 }
    );
  }
}
