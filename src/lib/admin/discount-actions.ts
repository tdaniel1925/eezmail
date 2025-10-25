'use server';

import { db } from '@/lib/db';
import {
  discountCodes,
  discountRedemptions,
  NewDiscountCode,
  DiscountCode,
  DiscountRedemption,
} from '@/db/schema';
import { requireAdmin, getAdminUser } from './auth';
import { eq, desc, and, or, lte, gte, isNull, lt } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

/**
 * Get all discount codes
 */
export async function getDiscountCodes(): Promise<{
  success: boolean;
  codes?: (DiscountCode & { redemptions?: DiscountRedemption[] })[];
  error?: string;
}> {
  try {
    await requireAdmin();

    const codes = await db.query.discountCodes.findMany({
      orderBy: [desc(discountCodes.createdAt)],
      with: {
        redemptions: true,
      },
    });

    return { success: true, codes };
  } catch (error: any) {
    console.error('Error fetching discount codes:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get active discount codes
 */
export async function getActiveDiscountCodes(): Promise<{
  success: boolean;
  codes?: DiscountCode[];
  error?: string;
}> {
  try {
    const now = new Date();

    const codes = await db.query.discountCodes.findMany({
      where: and(
        eq(discountCodes.isActive, true),
        or(isNull(discountCodes.expiresAt), gte(discountCodes.expiresAt, now))
      ),
      orderBy: [desc(discountCodes.createdAt)],
    });

    return { success: true, codes };
  } catch (error: any) {
    console.error('Error fetching active discount codes:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get a discount code by code string
 */
export async function getDiscountCodeByCode(code: string): Promise<{
  success: boolean;
  discountCode?: DiscountCode;
  error?: string;
}> {
  try {
    const discountCode = await db.query.discountCodes.findFirst({
      where: eq(discountCodes.code, code.toUpperCase()),
    });

    if (!discountCode) {
      return { success: false, error: 'Discount code not found' };
    }

    // Check if code is valid
    const now = new Date();
    if (!discountCode.isActive) {
      return {
        success: false,
        error: 'This discount code is no longer active',
      };
    }

    if (discountCode.expiresAt && discountCode.expiresAt < now) {
      return { success: false, error: 'This discount code has expired' };
    }

    if (discountCode.startsAt && discountCode.startsAt > now) {
      return { success: false, error: 'This discount code is not yet valid' };
    }

    if (
      discountCode.maxRedemptions &&
      discountCode.currentRedemptions >= discountCode.maxRedemptions
    ) {
      return {
        success: false,
        error: 'This discount code has reached its usage limit',
      };
    }

    return { success: true, discountCode };
  } catch (error: any) {
    console.error('Error fetching discount code:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new discount code
 */
export async function createDiscountCode(data: {
  code: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  appliesTo?: string;
  appliesToTierId?: string;
  maxRedemptions?: number;
  maxRedemptionsPerUser?: number;
  startsAt?: Date;
  expiresAt?: Date;
  createStripeCoupon?: boolean;
}): Promise<{
  success: boolean;
  code?: DiscountCode;
  error?: string;
}> {
  try {
    const admin = await getAdminUser();

    let stripeCouponId: string | undefined;

    // Create Stripe coupon if requested
    if (data.createStripeCoupon) {
      try {
        const coupon = await stripe.coupons.create({
          name: data.name,
          ...(data.discountType === 'percentage'
            ? { percent_off: data.discountValue }
            : {
                amount_off: Math.round(data.discountValue * 100),
                currency: 'usd',
              }),
          max_redemptions: data.maxRedemptions,
          redeem_by: data.expiresAt
            ? Math.floor(data.expiresAt.getTime() / 1000)
            : undefined,
        });

        stripeCouponId = coupon.id;
      } catch (stripeError: any) {
        console.error('Error creating Stripe coupon:', stripeError);
        return {
          success: false,
          error: `Stripe error: ${stripeError.message}`,
        };
      }
    }

    const newCode: NewDiscountCode = {
      code: data.code.toUpperCase(),
      name: data.name,
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue.toString(),
      appliesTo: data.appliesTo || 'all',
      appliesToTierId: data.appliesToTierId,
      maxRedemptions: data.maxRedemptions,
      maxRedemptionsPerUser: data.maxRedemptionsPerUser || 1,
      startsAt: data.startsAt,
      expiresAt: data.expiresAt,
      isActive: true,
      stripeCouponId,
      createdBy: admin.id,
    };

    const [code] = await db.insert(discountCodes).values(newCode).returning();

    revalidatePath('/admin/promotions');

    return { success: true, code };
  } catch (error: any) {
    console.error('Error creating discount code:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update a discount code
 */
export async function updateDiscountCode(
  codeId: string,
  data: Partial<{
    name: string;
    description: string;
    isActive: boolean;
    maxRedemptions: number;
    expiresAt: Date;
  }>
): Promise<{
  success: boolean;
  code?: DiscountCode;
  error?: string;
}> {
  try {
    await requireAdmin();

    const [code] = await db
      .update(discountCodes)
      .set(data)
      .where(eq(discountCodes.id, codeId))
      .returning();

    if (!code) {
      return { success: false, error: 'Discount code not found' };
    }

    revalidatePath('/admin/promotions');

    return { success: true, code };
  } catch (error: any) {
    console.error('Error updating discount code:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Deactivate a discount code
 */
export async function deactivateDiscountCode(codeId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();

    await db
      .update(discountCodes)
      .set({ isActive: false })
      .where(eq(discountCodes.id, codeId));

    revalidatePath('/admin/promotions');

    return { success: true };
  } catch (error: any) {
    console.error('Error deactivating discount code:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a discount code
 */
export async function deleteDiscountCode(codeId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();

    await db.delete(discountCodes).where(eq(discountCodes.id, codeId));

    revalidatePath('/admin/promotions');

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting discount code:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Redeem a discount code for a user
 */
export async function redeemDiscountCode(
  userId: string,
  code: string,
  subscriptionId?: string
): Promise<{
  success: boolean;
  discountCode?: DiscountCode;
  error?: string;
}> {
  try {
    // Get and validate the discount code
    const result = await getDiscountCodeByCode(code);
    if (!result.success || !result.discountCode) {
      return { success: false, error: result.error };
    }

    const discountCode = result.discountCode;

    // Check if user already redeemed this code
    const existingRedemption = await db.query.discountRedemptions.findFirst({
      where: and(
        eq(discountRedemptions.discountCodeId, discountCode.id),
        eq(discountRedemptions.userId, userId)
      ),
    });

    if (existingRedemption) {
      return {
        success: false,
        error: 'You have already used this discount code',
      };
    }

    // Check per-user redemption limit
    if (discountCode.maxRedemptionsPerUser) {
      const userRedemptions = await db.query.discountRedemptions.findMany({
        where: and(
          eq(discountRedemptions.discountCodeId, discountCode.id),
          eq(discountRedemptions.userId, userId)
        ),
      });

      if (userRedemptions.length >= discountCode.maxRedemptionsPerUser) {
        return {
          success: false,
          error: 'You have reached the usage limit for this code',
        };
      }
    }

    // Create redemption record
    await db.insert(discountRedemptions).values({
      discountCodeId: discountCode.id,
      userId,
      subscriptionId,
    });

    // Increment redemption count
    await db
      .update(discountCodes)
      .set({ currentRedemptions: discountCode.currentRedemptions + 1 })
      .where(eq(discountCodes.id, discountCode.id));

    return { success: true, discountCode };
  } catch (error: any) {
    console.error('Error redeeming discount code:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get discount code statistics
 */
export async function getDiscountCodeStats(codeId: string): Promise<{
  success: boolean;
  stats?: {
    totalRedemptions: number;
    uniqueUsers: number;
    totalRevenue: number;
    usagePercentage: number;
  };
  error?: string;
}> {
  try {
    await requireAdmin();

    const code = await db.query.discountCodes.findFirst({
      where: eq(discountCodes.id, codeId),
      with: {
        redemptions: true,
      },
    });

    if (!code) {
      return { success: false, error: 'Discount code not found' };
    }

    const totalRedemptions = code.redemptions.length;
    const uniqueUsers = new Set(code.redemptions.map((r) => r.userId)).size;
    const usagePercentage = code.maxRedemptions
      ? (code.currentRedemptions / code.maxRedemptions) * 100
      : 0;

    return {
      success: true,
      stats: {
        totalRedemptions,
        uniqueUsers,
        totalRevenue: 0, // TODO: Calculate from subscriptions
        usagePercentage,
      },
    };
  } catch (error: any) {
    console.error('Error fetching discount code stats:', error);
    return { success: false, error: error.message };
  }
}

