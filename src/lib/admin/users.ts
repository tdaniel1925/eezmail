'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from './auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export interface User {
  id: string;
  email: string;
  createdAt: string;
  tier: string;
  status: string;
  emailCount: number;
  lastActive: string | null;
}

export interface UserDetail extends User {
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  processor: string | null;
  cancelAtPeriodEnd: boolean;
  usage: {
    ragSearches: number;
    aiQueries: number;
    emailsStored: number;
  };
}

/**
 * Get paginated list of users with search and filters
 */
export async function getUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  tier?: string;
  status?: string;
}): Promise<{
  success: boolean;
  users?: User[];
  total?: number;
  page?: number;
  totalPages?: number;
  error?: string;
}> {
  try {
    await requireAdmin();

    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = sql`WHERE 1=1`;
    
    if (params.search) {
      whereClause = sql`${whereClause} AND u.email ILIKE ${'%' + params.search + '%'}`;
    }
    
    if (params.tier) {
      whereClause = sql`${whereClause} AND COALESCE(s.tier, 'free') = ${params.tier}`;
    }
    
    if (params.status) {
      whereClause = sql`${whereClause} AND COALESCE(s.status, 'active') = ${params.status}`;
    }

    // Get total count
    const countResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM auth.users u
      LEFT JOIN subscriptions s ON s.user_id = u.id
      ${whereClause}
    `);
    const total = parseInt(countResult.rows[0]?.count || '0');

    // Get users
    const result = await db.execute(sql`
      SELECT
        u.id,
        u.email,
        u.created_at,
        COALESCE(s.tier, 'free') as tier,
        COALESCE(s.status, 'active') as status,
        (SELECT COUNT(*) FROM emails WHERE user_id = u.id) as email_count,
        u.last_sign_in_at
      FROM auth.users u
      LEFT JOIN subscriptions s ON s.user_id = u.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    return {
      success: true,
      users: (result.rows || []).map((row: any) => ({
        id: row.id,
        email: row.email,
        createdAt: row.created_at,
        tier: row.tier,
        status: row.status,
        emailCount: parseInt(row.email_count || '0'),
        lastActive: row.last_sign_in_at,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error getting users:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get users',
    };
  }
}

/**
 * Get detailed user information
 */
export async function getUserDetail(userId: string): Promise<{
  success: boolean;
  user?: UserDetail;
  error?: string;
}> {
  try {
    await requireAdmin();

    const result = await db.execute(sql`
      SELECT
        u.id,
        u.email,
        u.created_at,
        COALESCE(s.tier, 'free') as tier,
        COALESCE(s.status, 'active') as status,
        s.id as subscription_id,
        s.status as subscription_status,
        s.current_period_end,
        s.processor,
        s.cancel_at_period_end,
        u.last_sign_in_at,
        (SELECT COUNT(*) FROM emails WHERE user_id = u.id) as email_count
      FROM auth.users u
      LEFT JOIN subscriptions s ON s.user_id = u.id
      WHERE u.id = ${userId}
    `);

    if (!result.rows || result.rows.length === 0) {
      return { success: false, error: 'User not found' };
    }

    const row = result.rows[0];

    // Get usage stats
    const usageResult = await db.execute(sql`
      SELECT
        resource_type,
        SUM(quantity) as total
      FROM usage_logs
      WHERE user_id = ${userId}
        AND created_at >= DATE_TRUNC('month', NOW())
      GROUP BY resource_type
    `);

    const usage = {
      ragSearches: 0,
      aiQueries: 0,
      emailsStored: parseInt(row.email_count || '0'),
    };

    (usageResult.rows || []).forEach((u: any) => {
      if (u.resource_type === 'rag_search') {
        usage.ragSearches = parseInt(u.total || '0');
      } else if (u.resource_type === 'ai_query') {
        usage.aiQueries = parseInt(u.total || '0');
      }
    });

    return {
      success: true,
      user: {
        id: row.id,
        email: row.email,
        createdAt: row.created_at,
        tier: row.tier,
        status: row.status,
        emailCount: parseInt(row.email_count || '0'),
        lastActive: row.last_sign_in_at,
        subscriptionId: row.subscription_id,
        subscriptionStatus: row.subscription_status,
        currentPeriodEnd: row.current_period_end,
        processor: row.processor,
        cancelAtPeriodEnd: row.cancel_at_period_end || false,
        usage,
      },
    };
  } catch (error) {
    console.error('Error getting user detail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user',
    };
  }
}

/**
 * Update user tier (admin override)
 */
export async function updateUserTier(
  userId: string,
  tier: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();

    await db.execute(sql`
      INSERT INTO subscriptions (user_id, tier, status, processor)
      VALUES (${userId}, ${tier}, 'active', 'manual')
      ON CONFLICT (user_id)
      DO UPDATE SET
        tier = ${tier},
        updated_at = NOW()
    `);

    return { success: true };
  } catch (error) {
    console.error('Error updating user tier:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update tier',
    };
  }
}

/**
 * Disable user account
 */
export async function disableUser(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Disable in Supabase Auth
    await supabase.auth.admin.updateUserById(userId, {
      ban_duration: '876000h', // 100 years (effectively permanent)
    });

    return { success: true };
  } catch (error) {
    console.error('Error disabling user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disable user',
    };
  }
}

/**
 * Enable user account
 */
export async function enableUser(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Unban in Supabase Auth
    await supabase.auth.admin.updateUserById(userId, {
      ban_duration: 'none',
    });

    return { success: true };
  } catch (error) {
    console.error('Error enabling user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enable user',
    };
  }
}

/**
 * Delete user account permanently
 */
export async function deleteUser(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Delete from Supabase (cascades to all related tables)
    await supabase.auth.admin.deleteUser(userId);

    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user',
    };
  }
}

/**
 * Generate impersonation token for support
 */
export async function generateImpersonationToken(userId: string): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Create a temporary session for the user
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userId,
    });

    if (error) throw error;

    return {
      success: true,
      token: data.properties?.action_link || undefined,
    };
  } catch (error) {
    console.error('Error generating impersonation token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate token',
    };
  }
}

