/**
 * Stripe Product Sync Service
 * Automatically syncs products between database and Stripe
 */

import Stripe from 'stripe';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { Product } from '@/db/schema';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not configured');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

export interface SyncResult {
  success: boolean;
  stripeProductId?: string;
  stripePriceId?: string;
  error?: string;
}

/**
 * Sync a product to Stripe
 * Creates or updates the product and price in Stripe
 */
export async function syncProductToStripe(
  productId: string
): Promise<SyncResult> {
  try {
    // Get product from database
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    if (!product.price) {
      return {
        success: false,
        error: 'Product must have a price to sync to Stripe',
      };
    }

    let stripeProductId = product.stripeProductId;

    // Create or update Stripe product
    if (!stripeProductId) {
      // Create new product in Stripe
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description || undefined,
        metadata: {
          product_id: product.id,
          category: product.category || '',
        },
        active: product.status === 'active',
      });
      stripeProductId = stripeProduct.id;
    } else {
      // Update existing product in Stripe
      await stripe.products.update(stripeProductId, {
        name: product.name,
        description: product.description || undefined,
        metadata: {
          product_id: product.id,
          category: product.category || '',
        },
        active: product.status === 'active',
      });
    }

    // Create Stripe price
    const priceData: Stripe.PriceCreateParams = {
      product: stripeProductId,
      currency: 'usd',
      unit_amount: Math.round(parseFloat(product.price) * 100), // Convert to cents
    };

    // Add recurring interval for subscriptions
    if (product.productType === 'subscription' && product.billingInterval) {
      priceData.recurring = {
        interval: product.billingInterval as 'day' | 'week' | 'month' | 'year',
        trial_period_days: product.trialPeriodDays || undefined,
      };
    }

    // For usage-based pricing
    if (
      product.productType === 'usage_based' &&
      product.usageUnit &&
      product.usageRate
    ) {
      priceData.billing_scheme = 'per_unit';
      priceData.recurring = {
        interval: 'month',
        usage_type: 'metered',
      };
    }

    const stripePrice = await stripe.prices.create(priceData);

    // Update database with Stripe IDs
    await db
      .update(products)
      .set({
        stripeProductId,
        stripePriceId: stripePrice.id,
        updatedAt: new Date(),
      })
      .where(eq(products.id, product.id));

    return {
      success: true,
      stripeProductId,
      stripePriceId: stripePrice.id,
    };
  } catch (error) {
    console.error('[Stripe Sync] Error syncing product:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sync all products to Stripe
 * Useful for initial setup or bulk sync
 */
export async function syncAllProductsToStripe(): Promise<{
  success: number;
  failed: number;
  errors: Array<{ productId: string; error: string }>;
}> {
  const allProducts = await db
    .select()
    .from(products)
    .where(eq(products.status, 'active'));

  let success = 0;
  let failed = 0;
  const errors: Array<{ productId: string; error: string }> = [];

  for (const product of allProducts) {
    const result = await syncProductToStripe(product.id);
    if (result.success) {
      success++;
    } else {
      failed++;
      errors.push({
        productId: product.id,
        error: result.error || 'Unknown error',
      });
    }
  }

  return { success, failed, errors };
}

/**
 * Create a Stripe checkout session for a product
 */
export async function createCheckoutSession(params: {
  productId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
  quantity?: number;
}): Promise<{ sessionId: string; url: string }> {
  const { productId, userId, successUrl, cancelUrl, quantity = 1 } = params;

  // Get product
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product) {
    throw new Error('Product not found');
  }

  if (!product.stripePriceId) {
    throw new Error(
      'Product not synced to Stripe. Please sync the product first.'
    );
  }

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    mode: product.productType === 'subscription' ? 'subscription' : 'payment',
    line_items: [
      {
        price: product.stripePriceId,
        quantity,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: userId,
    metadata: {
      product_id: productId,
      user_id: userId,
    },
  });

  return {
    sessionId: session.id,
    url: session.url!,
  };
}

/**
 * Handle Stripe webhook for product/price updates
 * This keeps our database in sync when changes are made in Stripe dashboard
 */
export async function handleStripeProductWebhook(
  event: Stripe.Event
): Promise<void> {
  switch (event.type) {
    case 'product.updated': {
      const stripeProduct = event.data.object as Stripe.Product;
      const productId = stripeProduct.metadata?.product_id;

      if (productId) {
        await db
          .update(products)
          .set({
            name: stripeProduct.name,
            description: stripeProduct.description || undefined,
            status: stripeProduct.active ? 'active' : 'archived',
            updatedAt: new Date(),
          })
          .where(eq(products.id, productId));
      }
      break;
    }

    case 'product.deleted': {
      const stripeProduct = event.data.object as Stripe.Product;
      const productId = stripeProduct.metadata?.product_id;

      if (productId) {
        await db
          .update(products)
          .set({
            status: 'archived',
            updatedAt: new Date(),
          })
          .where(eq(products.id, productId));
      }
      break;
    }

    case 'price.updated': {
      const stripePrice = event.data.object as Stripe.Price;

      // Find product by stripe price ID
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.stripePriceId, stripePrice.id))
        .limit(1);

      if (product) {
        const updates: Partial<Product> = {
          price: (stripePrice.unit_amount! / 100).toString(),
          updatedAt: new Date(),
        };

        if (stripePrice.recurring) {
          updates.billingInterval = stripePrice.recurring.interval;
          updates.trialPeriodDays =
            stripePrice.recurring.trial_period_days || 0;
        }

        await db
          .update(products)
          .set(updates)
          .where(eq(products.id, product.id));
      }
      break;
    }
  }
}

/**
 * Import products from Stripe
 * Useful for migrating existing Stripe products to database
 */
export async function importProductsFromStripe(): Promise<{
  imported: number;
  skipped: number;
}> {
  let imported = 0;
  let skipped = 0;

  // Get all products from Stripe
  const stripeProducts = await stripe.products.list({
    limit: 100,
    active: true,
  });

  for (const stripeProduct of stripeProducts.data) {
    // Check if product already exists
    const [existing] = await db
      .select()
      .from(products)
      .where(eq(products.stripeProductId, stripeProduct.id))
      .limit(1);

    if (existing) {
      skipped++;
      continue;
    }

    // Get default price for the product
    const prices = await stripe.prices.list({
      product: stripeProduct.id,
      limit: 1,
      active: true,
    });

    const defaultPrice = prices.data[0];

    if (!defaultPrice) {
      skipped++;
      continue;
    }

    // Determine product type
    let productType: 'subscription' | 'one_time' | 'usage_based' = 'one_time';
    let billingInterval: string | null = null;
    let trialPeriodDays = 0;

    if (defaultPrice.recurring) {
      productType =
        defaultPrice.recurring.usage_type === 'metered'
          ? 'usage_based'
          : 'subscription';
      billingInterval = defaultPrice.recurring.interval;
      trialPeriodDays = defaultPrice.recurring.trial_period_days || 0;
    }

    // Create slug from name
    const slug = stripeProduct.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    // Insert product
    await db.insert(products).values({
      name: stripeProduct.name,
      slug,
      description: stripeProduct.description || undefined,
      productType,
      price: (defaultPrice.unit_amount! / 100).toString(),
      billingInterval,
      trialPeriodDays,
      status: stripeProduct.active ? 'active' : 'archived',
      stripeProductId: stripeProduct.id,
      stripePriceId: defaultPrice.id,
      metadata: stripeProduct.metadata,
    });

    imported++;
  }

  return { imported, skipped };
}
