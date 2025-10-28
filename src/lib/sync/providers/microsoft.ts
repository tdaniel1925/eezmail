import { SyncProvider, ProviderFolder, ProviderEmail, EmailAddress } from './base';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Microsoft Graph API Provider
 * Handles OAuth token refresh, folder fetching, and email syncing for Microsoft/Outlook accounts
 */
export class MicrosoftProvider implements SyncProvider {
  name = 'microsoft';

  constructor(
    private accessToken: string,
    private refreshTokenValue: string,
    private accountId: string
  ) {}

  /**
   * Refresh the OAuth access token using the refresh token
   */
  async refreshToken(): Promise<string> {
    console.log('🔄 Refreshing Microsoft access token...');

    const response = await fetch(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
          refresh_token: this.refreshTokenValue,
          grant_type: 'refresh_token',
          scope:
            'https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/User.Read offline_access',
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Token refresh failed:', response.status, errorText);
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.refreshTokenValue = data.refresh_token || this.refreshTokenValue;

    // Update in database
    await db
      .update(emailAccounts)
      .set({
        accessToken: data.access_token,
        refreshToken: data.refresh_token || this.refreshTokenValue,
        tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
        updatedAt: new Date(),
      } as any)
      .where(eq(emailAccounts.id, this.accountId));

    console.log('✅ Token refreshed successfully');
    return data.access_token;
  }

  /**
   * Fetch all mail folders from Microsoft Graph
   */
  async fetchFolders(): Promise<ProviderFolder[]> {
    console.log('📁 Fetching Microsoft folders...');

    const response = await fetch(
      'https://graph.microsoft.com/v1.0/me/mailFolders',
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to fetch folders:', response.status, errorText);
      throw new Error(`Failed to fetch folders: ${response.status}`);
    }

    const data = await response.json();
    const folders: ProviderFolder[] = data.value.map((f: any) => ({
      id: f.id,
      name: f.displayName,
      totalMessages: f.totalItemCount || 0,
      unreadMessages: f.unreadItemCount || 0,
    }));

    console.log(`✅ Found ${folders.length} folders`);
    return folders;
  }

  /**
   * Fetch emails from a specific folder with delta sync support
   * @param folderId The folder ID to sync
   * @param cursor Optional delta link for incremental sync
   */
  async fetchEmails(
    folderId: string,
    cursor?: string
  ): Promise<{
    emails: ProviderEmail[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    // Use cursor if provided (incremental sync), otherwise start fresh
    const url =
      cursor ||
      `https://graph.microsoft.com/v1.0/me/mailFolders/${folderId}/messages/delta?$top=100&$select=id,internetMessageId,subject,from,toRecipients,ccRecipients,bccRecipients,receivedDateTime,sentDateTime,isRead,body,bodyPreview,hasAttachments`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ Failed to fetch emails from folder ${folderId}:`,
        response.status,
        errorText
      );
      throw new Error(`Failed to fetch emails: ${response.status}`);
    }

    const data = await response.json();

    // Map Microsoft Graph messages to ProviderEmail
    const emails: ProviderEmail[] = (data.value || []).map((msg: any) =>
      this.mapToProviderEmail(msg)
    );

    // Delta links: @odata.nextLink for pagination, @odata.deltaLink when complete
    const nextLink = data['@odata.nextLink'];
    const deltaLink = data['@odata.deltaLink'];

    return {
      emails,
      nextCursor: nextLink || deltaLink,
      hasMore: !!nextLink, // Has more pages if nextLink exists
    };
  }

  /**
   * Map Microsoft Graph message to standard ProviderEmail format
   */
  private mapToProviderEmail(msg: any): ProviderEmail {
    return {
      id: msg.id,
      messageId: msg.internetMessageId || msg.id,
      subject: msg.subject || '(No Subject)',
      from: this.mapEmailAddress(msg.from?.emailAddress),
      to:
        msg.toRecipients?.map((r: any) =>
          this.mapEmailAddress(r.emailAddress)
        ) || [],
      cc:
        msg.ccRecipients?.map((r: any) =>
          this.mapEmailAddress(r.emailAddress)
        ) || undefined,
      bcc:
        msg.bccRecipients?.map((r: any) =>
          this.mapEmailAddress(r.emailAddress)
        ) || undefined,
      receivedAt: new Date(msg.receivedDateTime),
      sentAt: msg.sentDateTime ? new Date(msg.sentDateTime) : undefined,
      bodyHtml:
        msg.body?.contentType === 'html' ? msg.body.content : undefined,
      bodyText:
        msg.body?.contentType === 'text' ? msg.body.content : undefined,
      snippet: msg.bodyPreview || '',
      isRead: msg.isRead || false,
      hasAttachments: msg.hasAttachments || false,
    };
  }

  /**
   * Map Microsoft email address to EmailAddress format
   */
  private mapEmailAddress(addr: any): EmailAddress {
    return {
      email: addr?.address || '',
      name: addr?.name,
    };
  }
}

