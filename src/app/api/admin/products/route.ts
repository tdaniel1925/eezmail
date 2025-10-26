/**
 * Products API Route
 * GET /api/admin/products - List all products
 * POST /api/admin/products - Create a new product
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { desc, eq, ilike, or } from 'drizzle-orm';
import { syncProductToStripe } from '@/lib/stripe/product-sync';
import { auditServerAction } from '@/lib/audit/middleware';
import { z } from 'zod';

const createProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  productType: z.enum(['subscription', 'one_time', 'usage_based']),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  billingInterval: z.enum(['day', 'week', 'month', 'year']).optional(),
  trialPeriodDays: z.number().optional(),
  usageUnit: z.string().optional(),
  usageRate: z.string().optional(),
  category: z.string().optional(),
  features: z.record(z.unknown()).optional(),
  syncToStripe: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
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
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'super_admin' && userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    // Build query
    let query = db.select().from(products);

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.description, `%${search}%`)
        )
      );
    }
    if (status) {
      conditions.push(eq(products.status, status));
    }
    if (category) {
      conditions.push(eq(products.category, category));
    }

    const allProducts = await query.orderBy(desc(products.createdAt));

    return NextResponse.json({
      products: allProducts,
      total: allProducts.length,
    });
  } catch (error) {
    console.error('[Products API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createProductSchema.parse(body);

    // Create product
    const [product] = await db
      .insert(products)
      .values({
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        productType: validatedData.productType,
        price: validatedData.price,
        billingInterval: validatedData.billingInterval,
        trialPeriodDays: validatedData.trialPeriodDays,
        usageUnit: validatedData.usageUnit,
        usageRate: validatedData.usageRate,
        category: validatedData.category,
        features: validatedData.features || {},
        status: 'active',
      })
      .returning();

    // Sync to Stripe if requested
    let syncResult = null;
    if (validatedData.syncToStripe) {
      syncResult = await syncProductToStripe(product.id);
    }

    // Audit log
    await auditServerAction('create', 'product', {
      userId: user.id,
      userEmail: userData.email,
      resourceId: product.id,
      metadata: {
        productName: product.name,
        syncedToStripe: syncResult?.success || false,
      },
    });

    return NextResponse.json({
      success: true,
      product,
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
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
