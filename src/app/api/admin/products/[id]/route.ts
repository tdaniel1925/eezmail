/**
 * Single Product API Route
 * PATCH /api/admin/products/[id] - Update a product
 * DELETE /api/admin/products/[id] - Delete a product
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { syncProductToStripe } from '@/lib/stripe/product-sync';
import { auditServerAction } from '@/lib/audit/middleware';
import { z } from 'zod';

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  productType: z.enum(['subscription', 'one_time', 'usage_based']).optional(),
  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
  billingInterval: z.enum(['day', 'week', 'month', 'year']).optional(),
  trialPeriodDays: z.number().optional(),
  usageUnit: z.string().optional(),
  usageRate: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['active', 'archived', 'draft']).optional(),
  features: z.record(z.unknown()).optional(),
  syncToStripe: z.boolean().optional().default(false),
});

export async function PATCH(
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

    // Get existing product
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateProductSchema.parse(body);

    // Update product
    const [updatedProduct] = await db
      .update(products)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    // Sync to Stripe if requested
    let syncResult = null;
    if (validatedData.syncToStripe) {
      syncResult = await syncProductToStripe(id);
    }

    // Audit log
    await auditServerAction('update', 'product', {
      userId: user.id,
      userEmail: userData.email,
      resourceId: id,
      changes: {
        before: existingProduct,
        after: updatedProduct,
      },
      metadata: {
        syncedToStripe: syncResult?.success || false,
      },
    });

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      stripeSync: syncResult,
    });
  } catch (error) {
    console.error('[Products API] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Get product
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Soft delete by setting status to archived
    await db
      .update(products)
      .set({
        status: 'archived',
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    // Audit log
    await auditServerAction('delete', 'product', {
      userId: user.id,
      userEmail: userData.email,
      resourceId: id,
      metadata: {
        productName: product.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Product archived successfully',
    });
  } catch (error) {
    console.error('[Products API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
