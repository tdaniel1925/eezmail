'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { MicrosoftGraphService } from '@/lib/email/microsoft-graph';
import { GmailService } from '@/lib/email/gmail-api';
import { TokenManager } from '@/lib/email/token-manager';
import { IMAPService, IMAP_PROVIDERS } from '@/lib/email/imap-service';

/**
 * Initiate email account connection via OAuth
 */
export async function initiateEmailConnection(provider: string) {
  console.log('🚀 INITIATING EMAIL CONNECTION for provider:', provider);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log('👤 User authenticated:', !!user, user?.id);

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate provider
    if (
      !['gmail', 'microsoft', 'yahoo', 'imap', 'outlook'].includes(provider)
    ) {
      return { success: false, error: 'Invalid provider' };
    }

    // Handle IMAP providers
    if (provider === 'imap' || provider === 'yahoo') {
      return {
        success: true,
        type: 'imap',
        url: `/dashboard/settings/email/imap-setup?provider=${provider}&userId=${user.id}`,
      };
    }

    // Handle Microsoft Graph API
    if (provider === 'microsoft' || provider === 'outlook') {
      console.log('🔧 Microsoft Graph API - Environment variables check:');
      console.log(
        'MICROSOFT_CLIENT_ID:',
        process.env.MICROSOFT_CLIENT_ID ? 'Found' : 'Missing'
      );
      console.log(
        'MICROSOFT_CLIENT_SECRET:',
        process.env.MICROSOFT_CLIENT_SECRET ? 'Found' : 'Missing'
      );
      console.log(
        'MICROSOFT_TENANT_ID:',
        process.env.MICROSOFT_TENANT_ID || 'common'
      );

      // Use environment variable or fallback to localhost for development
      // In production (Vercel), NEXT_PUBLIC_APP_URL should be set
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000';

      const msGraphConfig = {
        clientId: process.env.MICROSOFT_CLIENT_ID!,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
        tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
        redirectUri: `${appUrl}/api/auth/microsoft/callback`,
      };

      console.log('🔗 Using redirect URI:', msGraphConfig.redirectUri);

      if (!msGraphConfig.clientId || !msGraphConfig.clientSecret) {
        console.log('❌ Microsoft Graph API not configured');
        return {
          success: false,
          error:
            'Microsoft Graph API not configured. Missing MICROSOFT_CLIENT_ID or MICROSOFT_CLIENT_SECRET',
        };
      }

      console.log('✅ Microsoft Graph API configured, generating auth URL...');
      const msGraph = new MicrosoftGraphService(msGraphConfig);
      const state = JSON.stringify({ userId: user.id, provider });
      const authUrl = msGraph.generateAuthUrl(state);

      console.log(
        '🔗 Microsoft Graph auth URL generated:',
        authUrl.substring(0, 100) + '...'
      );

      return {
        success: true,
        type: 'oauth',
        url: authUrl,
      };
    }

    // Handle Gmail API
    if (provider === 'gmail') {
      // Use environment variable or fallback to localhost for development
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000';

      const gmailConfig = {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri: `${appUrl}/api/auth/google/callback`,
      };

      console.log('🔗 Using Gmail redirect URI:', gmailConfig.redirectUri);

      if (!gmailConfig.clientId || !gmailConfig.clientSecret) {
        return {
          success: false,
          error:
            'Gmail API not configured. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET',
        };
      }

      const gmail = new GmailService(gmailConfig);
      const state = JSON.stringify({ userId: user.id, provider });
      // Use incremental auth: start with base + read scopes only
      const authUrl = gmail.generateAuthUrl(state, ['base', 'read']);

      return {
        success: true,
        type: 'oauth',
        url: authUrl,
      };
    }

    // Fallback for unsupported providers
    return {
      success: false,
      error: `Provider ${provider} not supported. Please use microsoft, gmail, or imap.`,
    };
  } catch (error) {
    console.error('Error initiating email connection:', error);
    return { success: false, error: 'Failed to initiate connection' };
  }
}

/**
 * Set an email account as default
 */
export async function setDefaultEmailAccount(accountId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify account belongs to user
    const account = await db.query.emailAccounts.findFirst({
      where: (accounts, { and, eq }) =>
        and(eq(accounts.id, accountId), eq(accounts.userId, user.id)),
    });

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Remove default from all other accounts
    await db
      .update(emailAccounts)
      .set({ isDefault: false } as Partial<typeof emailAccounts.$inferInsert>)
      .where(eq(emailAccounts.userId, user.id));

    // Set this account as default
    await db
      .update(emailAccounts)
      .set({ isDefault: true } as Partial<typeof emailAccounts.$inferInsert>)
      .where(eq(emailAccounts.id, accountId));

    revalidatePath('/dashboard/settings');

    return { success: true, message: 'Default account updated' };
  } catch (error) {
    console.error('Error setting default account:', error);
    return { success: false, error: 'Failed to update default account' };
  }
}

/**
 * Disconnect email account (pause syncing but keep data)
 */
export async function disconnectEmailAccount(accountId: string) {
  console.log('⏸️ Disconnecting email account:', accountId);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update account to inactive status
    await db
      .update(emailAccounts)
      .set({
        status: 'inactive',
        updatedAt: new Date(),
      })
      .where(
        and(eq(emailAccounts.id, accountId), eq(emailAccounts.userId, user.id))
      );

    console.log('✅ Account disconnected successfully');

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error) {
    console.error('❌ Error disconnecting account:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to disconnect account',
    };
  }
}

/**
 * Reconnect email account (resume syncing)
 */
export async function reconnectEmailAccount(accountId: string) {
  console.log('▶️ Reconnecting email account:', accountId);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update account to active status
    await db
      .update(emailAccounts)
      .set({
        status: 'active',
        updatedAt: new Date(),
      })
      .where(
        and(eq(emailAccounts.id, accountId), eq(emailAccounts.userId, user.id))
      );

    console.log('✅ Account reconnected successfully');

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (error) {
    console.error('❌ Error reconnecting account:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to reconnect account',
    };
  }
}

/**
 * Remove an email account
 */
export async function removeEmailAccount(accountId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify account belongs to user
    const account = await db.query.emailAccounts.findFirst({
      where: (accounts, { and, eq }) =>
        and(eq(accounts.id, accountId), eq(accounts.userId, user.id)),
    });

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // TODO: Revoke Nylas access if applicable
    // TODO: Delete associated emails, settings, etc. (handled by CASCADE)

    // Delete the account
    await db
      .delete(emailAccounts)
      .where(
        and(eq(emailAccounts.id, accountId), eq(emailAccounts.userId, user.id))
      );

    revalidatePath('/dashboard/settings');

    return { success: true, message: 'Account removed successfully' };
  } catch (error) {
    console.error('Error removing email account:', error);
    return { success: false, error: 'Failed to remove account' };
  }
}

/**
 * Manually trigger sync for an email account
 */
export async function syncEmailAccount(accountId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify account belongs to user
    const account = await db.query.emailAccounts.findFirst({
      where: (accounts, { and, eq }) =>
        and(eq(accounts.id, accountId), eq(accounts.userId, user.id)),
    });

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    console.log('🔵 Manual sync requested');
    console.log('   Account:', account.emailAddress);
    console.log('   Provider:', account.provider);

    // Trigger sync via orchestrator
    const { triggerSync } = await import('@/lib/sync/sync-orchestrator');
    const syncResult = await triggerSync({
      accountId,
      userId: user.id,
      trigger: 'manual',
    });

    if (!syncResult.success) {
      return {
        success: false,
        error: syncResult.error || 'Failed to start sync',
      };
    }

    console.log('✅ Sync started successfully');
    console.log(`   Run ID: ${syncResult.runId}`);

    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/inbox');

    return {
      success: true,
      message: 'Sync started successfully',
      runId: syncResult.runId,
    };
  } catch (error) {
    console.error('❌ Error triggering manual sync:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start sync',
    };
  }
}
