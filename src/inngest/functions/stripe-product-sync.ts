/**
 * Stripe Product Sync Background Job
 * Periodically syncs products with Stripe
 */

import { inngest } from '../client';
import { syncAllProductsToStripe } from '@/lib/stripe/product-sync';

export const stripeProductSync = inngest.createFunction(
  {
    id: 'stripe-product-sync',
    name: 'Sync Products to Stripe',
  },
  { cron: '0 * * * *' }, // Run hourly
  async ({ step }) => {
    const result = await step.run('sync-all-products', async () => {
      return await syncAllProductsToStripe();
    });

    return {
      success: true,
      ...result,
    };
  }
);

// On-demand sync triggered by API
export const stripeProductSyncOnDemand = inngest.createFunction(
  {
    id: 'stripe-product-sync-on-demand',
    name: 'Sync Single Product to Stripe',
  },
  { event: 'product/sync.requested' },
  async ({ event, step }) => {
    const { productId } = event.data;

    const result = await step.run('sync-product', async () => {
      const { syncProductToStripe } = await import('@/lib/stripe/product-sync');
      return await syncProductToStripe(productId);
    });

    return {
      success: result.success,
      productId,
      ...result,
    };
  }
);
