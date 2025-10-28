'use server';

import { db } from '@/lib/db';
import { users, betaAnalytics } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { BetaCredits } from './credits-manager';
import { sendBetaWelcomeEmail } from './email-sender';
import { createClient } from '@/lib/supabase/server';

export interface InviteBetaUserParams {
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  invitedBy: string; // Admin user ID
  smsLimit?: number;
  aiLimit?: number;
  durationDays?: number;
}

export interface BetaUserWithStats {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  betaCredits: BetaCredits | null;
  betaInvitedAt: Date | null;
  betaExpiresAt: Date | null;
  createdAt: Date;
  stats: {
    loginCount: number;
    feedbackCount: number;
    lastActive: Date | null;
    daysUntilExpiration: number | null;
  };
}

/**
 * Generate username from name
 * Converts "John Smith" to "john_smith"
 */
function generateUsername(firstName: string, lastName: string): string {
  const base = `${firstName}_${lastName}`.toLowerCase().replace(/[^a-z0-9_]/g, '');
  return base;
}

/**
 * Generate secure temporary password
 */
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Check if username already exists and make it unique
 */
async function ensureUniqueUsername(baseUsername: string): Promise<string> {
  let username = baseUsername;
  let counter = 1;

  while (true) {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!existing) {
      return username;
    }

    username = `${baseUsername}${counter}`;
    counter++;
  }
}

/**
 * Invite a new beta user
 */
export async function inviteBetaUser(params: InviteBetaUserParams): Promise<{
  success: boolean;
  userId?: string;
  username?: string;
  tempPassword?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Check if email already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, params.email))
      .limit(1);

    if (existingUser) {
      return { success: false, error: 'Email already registered' };
    }

    // Generate username and password
    const baseUsername = generateUsername(params.firstName, params.lastName);
    const username = await ensureUniqueUsername(baseUsername);
    const tempPassword = generateTempPassword();

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: params.email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm for beta users
    });

    if (authError || !authData.user) {
      console.error('Failed to create auth user:', authError);
      return { success: false, error: 'Failed to create authentication account' };
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (params.durationDays || 90));

    // Calculate first credit reset date (1 month from now)
    const resetDate = new Date();
    resetDate.setMonth(resetDate.getMonth() + 1);

    // Create initial credits
    const initialCredits: BetaCredits = {
      sms_limit: params.smsLimit || 50,
      sms_used: 0,
      ai_limit: params.aiLimit || 100,
      ai_used: 0,
      reset_date: resetDate.toISOString(),
    };

    // Create user record
    const [newUser] = await db
      .insert(users)
      .values({
        id: authData.user.id,
        email: params.email,
        username,
        firstName: params.firstName,
        lastName: params.lastName,
        name: `${params.firstName} ${params.lastName}`,
        accountType: 'beta',
        betaCredits: initialCredits,
        betaInvitedAt: new Date(),
        betaExpiresAt: expiresAt,
        betaInvitedBy: params.invitedBy,
      })
      .returning();

    // Track invitation
    await db.insert(betaAnalytics).values({
      userId: newUser.id,
      eventType: 'beta_invited',
      eventData: {
        invited_by: params.invitedBy,
        expires_at: expiresAt.toISOString(),
        initial_credits: initialCredits,
      },
    });

    // Send welcome email
    await sendBetaWelcomeEmail(newUser.id, username, tempPassword);

    return {
      success: true,
      userId: newUser.id,
      username,
      tempPassword,
    };
  } catch (error) {
    console.error('Error inviting beta user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all beta users with stats
 */
export async function getAllBetaUsers(): Promise<BetaUserWithStats[]> {
  const betaUsers = await db
    .select()
    .from(users)
    .where(eq(users.accountType, 'beta'));

  const usersWithStats = await Promise.all(
    betaUsers.map(async (user) => {
      // Get analytics for this user
      const analytics = await db
        .select()
        .from(betaAnalytics)
        .where(eq(betaAnalytics.userId, user.id));

      const loginCount = analytics.filter((a) => a.eventType === 'login').length;
      const feedbackCount = analytics.filter((a) => a.eventType === 'feedback_submitted')
        .length;

      const lastActive = analytics.length > 0
        ? new Date(Math.max(...analytics.map((a) => new Date(a.createdAt).getTime())))
        : null;

      let daysUntilExpiration: number | null = null;
      if (user.betaExpiresAt) {
        const now = new Date();
        const expiresAt = new Date(user.betaExpiresAt);
        const diffTime = expiresAt.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysUntilExpiration = diffDays > 0 ? diffDays : 0;
      }

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        betaCredits: user.betaCredits as BetaCredits | null,
        betaInvitedAt: user.betaInvitedAt,
        betaExpiresAt: user.betaExpiresAt,
        createdAt: user.createdAt,
        stats: {
          loginCount,
          feedbackCount,
          lastActive,
          daysUntilExpiration,
        },
      };
    })
  );

  return usersWithStats;
}

/**
 * Get beta user details by ID
 */
export async function getBetaUserById(userId: string): Promise<BetaUserWithStats | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user || user.accountType !== 'beta') {
    return null;
  }

  const analytics = await db
    .select()
    .from(betaAnalytics)
    .where(eq(betaAnalytics.userId, user.id));

  const loginCount = analytics.filter((a) => a.eventType === 'login').length;
  const feedbackCount = analytics.filter((a) => a.eventType === 'feedback_submitted').length;

  const lastActive = analytics.length > 0
    ? new Date(Math.max(...analytics.map((a) => new Date(a.createdAt).getTime())))
    : null;

  let daysUntilExpiration: number | null = null;
  if (user.betaExpiresAt) {
    const now = new Date();
    const expiresAt = new Date(user.betaExpiresAt);
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    daysUntilExpiration = diffDays > 0 ? diffDays : 0;
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    betaCredits: user.betaCredits as BetaCredits | null,
    betaInvitedAt: user.betaInvitedAt,
    betaExpiresAt: user.betaExpiresAt,
    createdAt: user.createdAt,
    stats: {
      loginCount,
      feedbackCount,
      lastActive,
      daysUntilExpiration,
    },
  };
}

/**
 * Remove beta user (convert to regular or delete)
 */
export async function removeBetaUser(
  userId: string,
  action: 'convert' | 'delete'
): Promise<{ success: boolean; error?: string }> {
  try {
    if (action === 'convert') {
      // Convert to paid user
      await db
        .update(users)
        .set({
          accountType: 'individual',
          betaCredits: null,
          betaExpiresAt: null,
        })
        .where(eq(users.id, userId));

      await db.insert(betaAnalytics).values({
        userId,
        eventType: 'beta_graduated',
        eventData: { action: 'converted_to_paid' },
      });
    } else {
      // Mark as deleted
      await db
        .update(users)
        .set({
          isDeleted: true,
          deletedAt: new Date(),
        })
        .where(eq(users.id, userId));

      await db.insert(betaAnalytics).values({
        userId,
        eventType: 'beta_removed',
        eventData: { action: 'deleted' },
      });
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

