'use server';

import { db } from '@/lib/db';
import {
  pricingTiers,
  tierFeatures,
  NewPricingTier,
  NewTierFeature,
  PricingTier,
  TierFeature,
} from '@/db/schema';
import { requireAdmin } from './auth';
import { eq, desc, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Get all pricing tiers with their features
 */
export async function getPricingTiers(): Promise<{
  success: boolean;
  tiers?: (PricingTier & { features: TierFeature[] })[];
  error?: string;
}> {
  try {
    await requireAdmin();

    const tiers = await db.query.pricingTiers.findMany({
      orderBy: [desc(pricingTiers.sortOrder)],
      with: {
        features: {
          orderBy: [desc(tierFeatures.sortOrder)],
        },
      },
    });

    return { success: true, tiers };
  } catch (error: any) {
    console.error('Error fetching pricing tiers:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get active pricing tiers for public display
 */
export async function getActivePricingTiers(): Promise<{
  success: boolean;
  tiers?: (PricingTier & { features: TierFeature[] })[];
  error?: string;
}> {
  try {
    const tiers = await db.query.pricingTiers.findMany({
      where: eq(pricingTiers.isActive, true),
      orderBy: [desc(pricingTiers.sortOrder)],
      with: {
        features: {
          where: eq(tierFeatures.isVisible, true),
          orderBy: [desc(tierFeatures.sortOrder)],
        },
      },
    });

    return { success: true, tiers };
  } catch (error: any) {
    console.error('Error fetching active pricing tiers:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get a single pricing tier by ID
 */
export async function getPricingTierById(tierId: string): Promise<{
  success: boolean;
  tier?: PricingTier & { features: TierFeature[] };
  error?: string;
}> {
  try {
    await requireAdmin();

    const tier = await db.query.pricingTiers.findFirst({
      where: eq(pricingTiers.id, tierId),
      with: {
        features: {
          orderBy: [desc(tierFeatures.sortOrder)],
        },
      },
    });

    if (!tier) {
      return { success: false, error: 'Pricing tier not found' };
    }

    return { success: true, tier };
  } catch (error: any) {
    console.error('Error fetching pricing tier:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new pricing tier
 */
export async function createPricingTier(data: {
  name: string;
  slug: string;
  description?: string;
  price?: number;
  interval?: string;
  isHighlighted?: boolean;
  isCustom?: boolean;
  sortOrder?: number;
}): Promise<{
  success: boolean;
  tier?: PricingTier;
  error?: string;
}> {
  try {
    await requireAdmin();

    const newTier: NewPricingTier = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price?.toString(),
      interval: data.interval || 'month',
      isHighlighted: data.isHighlighted || false,
      isCustom: data.isCustom || false,
      sortOrder: data.sortOrder || 0,
      isActive: true,
    };

    const [tier] = await db.insert(pricingTiers).values(newTier).returning();

    revalidatePath('/admin/pricing');
    revalidatePath('/pricing');

    return { success: true, tier };
  } catch (error: any) {
    console.error('Error creating pricing tier:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a pricing tier
 */
export async function updatePricingTier(
  tierId: string,
  data: Partial<{
    name: string;
    description: string;
    price: number;
    interval: string;
    isActive: boolean;
    isHighlighted: boolean;
    sortOrder: number;
    stripeProductId: string;
    stripePriceId: string;
  }>
): Promise<{
  success: boolean;
  tier?: PricingTier;
  error?: string;
}> {
  try {
    await requireAdmin();

    const updateData: any = { ...data };
    if (data.price !== undefined) {
      updateData.price = data.price.toString();
    }

    const [tier] = await db
      .update(pricingTiers)
      .set(updateData)
      .where(eq(pricingTiers.id, tierId))
      .returning();

    if (!tier) {
      return { success: false, error: 'Pricing tier not found' };
    }

    revalidatePath('/admin/pricing');
    revalidatePath('/pricing');

    return { success: true, tier };
  } catch (error: any) {
    console.error('Error updating pricing tier:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a pricing tier
 */
export async function deletePricingTier(tierId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();

    await db.delete(pricingTiers).where(eq(pricingTiers.id, tierId));

    revalidatePath('/admin/pricing');
    revalidatePath('/pricing');

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting pricing tier:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add or update a feature for a tier
 */
export async function upsertTierFeature(data: {
  tierId: string;
  featureKey: string;
  featureName: string;
  featureValue: number;
  featureType?: string;
  isVisible?: boolean;
  sortOrder?: number;
}): Promise<{
  success: boolean;
  feature?: TierFeature;
  error?: string;
}> {
  try {
    await requireAdmin();

    // Check if feature exists
    const existing = await db.query.tierFeatures.findFirst({
      where: and(
        eq(tierFeatures.tierId, data.tierId),
        eq(tierFeatures.featureKey, data.featureKey)
      ),
    });

    let feature: TierFeature;

    if (existing) {
      // Update existing feature
      [feature] = await db
        .update(tierFeatures)
        .set({
          featureName: data.featureName,
          featureValue: data.featureValue,
          featureType: data.featureType,
          isVisible: data.isVisible,
          sortOrder: data.sortOrder,
        })
        .where(eq(tierFeatures.id, existing.id))
        .returning();
    } else {
      // Create new feature
      const newFeature: NewTierFeature = {
        tierId: data.tierId,
        featureKey: data.featureKey,
        featureName: data.featureName,
        featureValue: data.featureValue,
        featureType: data.featureType || 'limit',
        isVisible: data.isVisible !== undefined ? data.isVisible : true,
        sortOrder: data.sortOrder || 0,
      };

      [feature] = await db.insert(tierFeatures).values(newFeature).returning();
    }

    revalidatePath('/admin/pricing');
    revalidatePath('/pricing');

    return { success: true, feature };
  } catch (error: any) {
    console.error('Error upserting tier feature:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a tier feature
 */
export async function deleteTierFeature(featureId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();

    await db.delete(tierFeatures).where(eq(tierFeatures.id, featureId));

    revalidatePath('/admin/pricing');
    revalidatePath('/pricing');

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting tier feature:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Bulk update tier features
 */
export async function bulkUpdateTierFeatures(
  tierId: string,
  features: Array<{
    featureKey: string;
    featureName: string;
    featureValue: number;
    featureType?: string;
    isVisible?: boolean;
    sortOrder?: number;
  }>
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();

    // Delete all existing features for this tier
    await db.delete(tierFeatures).where(eq(tierFeatures.tierId, tierId));

    // Insert new features
    const newFeatures: NewTierFeature[] = features.map((f) => ({
      tierId,
      featureKey: f.featureKey,
      featureName: f.featureName,
      featureValue: f.featureValue,
      featureType: f.featureType || 'limit',
      isVisible: f.isVisible !== undefined ? f.isVisible : true,
      sortOrder: f.sortOrder || 0,
    }));

    await db.insert(tierFeatures).values(newFeatures);

    revalidatePath('/admin/pricing');
    revalidatePath('/pricing');

    return { success: true };
  } catch (error: any) {
    console.error('Error bulk updating tier features:', error);
    return { success: false, error: error.message };
  }
}

