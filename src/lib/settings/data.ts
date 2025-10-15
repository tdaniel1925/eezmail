'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Fetch complete user data including settings, accounts, and subscription
 */
export async function getUserSettingsData() {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return {
        success: false,
        error: 'Not authenticated',
        data: null,
      };
    }

    // Fetch user from database
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, authUser.id),
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
        data: null,
      };
    }

    // Fetch email accounts
    const emailAccounts = await db.query.emailAccounts.findMany({
      where: (accounts, { eq }) => eq(accounts.userId, authUser.id),
      orderBy: (accounts, { desc }) => [desc(accounts.isDefault)],
    });

    console.log('🔍 Fetched email accounts from database:', {
      userId: authUser.id,
      accountsCount: emailAccounts.length,
      accounts: emailAccounts,
    });

    // Fetch email settings for the default account
    const defaultAccount =
      emailAccounts.find((acc) => acc.isDefault) || emailAccounts[0];

    let settings = null;
    if (defaultAccount) {
      settings = await db.query.emailSettings.findFirst({
        where: (emailSettings, { eq }) =>
          eq(emailSettings.accountId, defaultAccount.id),
      });
    }

    // Fetch subscription
    const subscription = await db.query.subscriptions.findFirst({
      where: (subscriptions, { eq }) => eq(subscriptions.userId, authUser.id),
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
    });

    return {
      success: true,
      error: null,
      data: {
        user,
        emailAccounts,
        settings,
        subscription,
        defaultAccountId: defaultAccount?.id || null,
      },
    };
  } catch (error) {
    console.error('Error fetching user settings data:', error);
    return {
      success: false,
      error: 'Failed to fetch user data',
      data: null,
    };
  }
}

/**
 * Fetch billing information including current plan and usage
 */
export async function getBillingInfo() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const userData = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, user.id),
    });

    if (!userData) {
      return { success: false, error: 'User not found' };
    }

    const subscription = await db.query.subscriptions.findFirst({
      where: (subscriptions, { eq }) => eq(subscriptions.userId, user.id),
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
    });

    // Get account count for plan limits
    const accountCount = await db.query.emailAccounts.findMany({
      where: (accounts, { eq }) => eq(accounts.userId, user.id),
    });

    return {
      success: true,
      data: {
        user: userData,
        subscription,
        accountCount: accountCount.length,
      },
    };
  } catch (error) {
    console.error('Error fetching billing info:', error);
    return { success: false, error: 'Failed to fetch billing information' };
  }
}

/**
 * Sync email account with provider
 */
export async function syncEmailAccount(accountId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify account belongs to user
    const account = await db.query.emailAccounts.findFirst({
      where: (accounts, { and, eq }) =>
        and(eq(accounts.id, accountId), eq(accounts.userId, user.id)),
    });

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Update sync timestamp
    await db
      .update(emailAccounts)
      .set({
        lastSyncAt: new Date(),
        status: 'syncing',
      })
      .where(eq(emailAccounts.id, accountId));

    // TODO: Trigger actual sync with Nylas/email provider
    // This would be done in a background job in production

    // Simulate sync completion
    setTimeout(async () => {
      await db
        .update(emailAccounts)
        .set({
          status: 'active',
        })
        .where(eq(emailAccounts.id, accountId));
    }, 2000);

    return { success: true, message: 'Sync initiated' };
  } catch (error) {
    console.error('Error syncing email account:', error);
    return { success: false, error: 'Failed to sync account' };
  }
}
