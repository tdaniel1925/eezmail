import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { MicrosoftGraphService } from './microsoft-graph';

/**
 * Token Manager - Handles automatic token refresh for email providers
 */
export class TokenManager {
  /**
   * Get a valid access token, refreshing if necessary
   */
  static async getValidAccessToken(accountId: string): Promise<{
    accessToken: string;
    needsRefresh: boolean;
  }> {
    const account = await db.query.emailAccounts.findFirst({
      where: (accounts, { eq }) => eq(accounts.id, accountId),
    });

    if (!account) {
      throw new Error('Account not found');
    }

    if (!account.accessToken) {
      throw new Error('No access token available');
    }

    // Check if token is expired or will expire soon (within 5 minutes)
    const now = new Date();
    const expiresAt = account.tokenExpiresAt;
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (!expiresAt || expiresAt <= fiveMinutesFromNow) {
      console.log('🔄 Token expired or expiring soon, refreshing...');

      if (!account.refreshToken) {
        throw new Error(
          'No refresh token available. Please reconnect your account.'
        );
      }

      // Refresh the token
      const refreshed = await this.refreshToken(account);
      return {
        accessToken: refreshed.accessToken,
        needsRefresh: true,
      };
    }

    return {
      accessToken: account.accessToken,
      needsRefresh: false,
    };
  }

  /**
   * Refresh access token for an account
   */
  private static async refreshToken(account: any): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    if (account.provider !== 'microsoft') {
      throw new Error(
        `Token refresh not supported for provider: ${account.provider}`
      );
    }

    const msGraphConfig = {
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/microsoft/callback`,
    };

    const msGraph = new MicrosoftGraphService(msGraphConfig);

    try {
      const tokenResponse = await msGraph.refreshAccessToken(
        account.refreshToken
      );

      // Update the account with new tokens
      const expiresAt = new Date(Date.now() + tokenResponse.expiresIn * 1000);

      await db
        .update(emailAccounts)
        .set({
          accessToken: tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken,
          tokenExpiresAt: expiresAt,
          lastSyncAt: new Date(),
          lastSyncError: null,
        })
        .where(eq(emailAccounts.id, account.id));

      console.log('✅ Token refreshed successfully');

      return {
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken,
        expiresIn: tokenResponse.expiresIn,
      };
    } catch (error) {
      console.error('❌ Token refresh failed:', error);

      // Mark account as needing reconnection
      await db
        .update(emailAccounts)
        .set({
          status: 'error',
          lastSyncError: 'Token refresh failed. Please reconnect your account.',
          consecutiveErrors: (account.consecutiveErrors || 0) + 1,
        })
        .where(eq(emailAccounts.id, account.id));

      throw new Error('Token refresh failed. Please reconnect your account.');
    }
  }

  /**
   * Check if an account needs reconnection
   */
  static async needsReconnection(accountId: string): Promise<boolean> {
    const account = await db.query.emailAccounts.findFirst({
      where: (accounts, { eq }) => eq(accounts.id, accountId),
    });

    if (!account) return true;
    if (!account.accessToken) return true;
    if (!account.refreshToken) return true;
    if (account.status === 'error') return true;

    return false;
  }
}
