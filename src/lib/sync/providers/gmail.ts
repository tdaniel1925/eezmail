import { SyncProvider, ProviderFolder, ProviderEmail, EmailAddress } from './base';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { gmail_v1, google } from 'googleapis';

/**
 * Gmail API Provider
 * Handles OAuth token refresh, label fetching, and email syncing for Gmail accounts
 */
export class GmailProvider implements SyncProvider {
  name = 'gmail';
  private gmail: gmail_v1.Gmail;

  constructor(
    private accessToken: string,
    private refreshTokenValue: string,
    private accountId: string
  ) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    );

    oauth2Client.setCredentials({
      access_token: this.accessToken,
      refresh_token: this.refreshTokenValue,
    });

    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  }

  /**
   * Refresh the OAuth access token
   */
  async refreshToken(): Promise<string> {
    console.log('🔄 Refreshing Gmail access token...');

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: this.refreshTokenValue,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Token refresh failed:', response.status, errorText);
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;

    // Update in database
    await db
      .update(emailAccounts)
      .set({
        accessToken: data.access_token,
        tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
        updatedAt: new Date(),
      } as any)
      .where(eq(emailAccounts.id, this.accountId));

    // Update gmail client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    );

    oauth2Client.setCredentials({
      access_token: data.access_token,
      refresh_token: this.refreshTokenValue,
    });

    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    console.log('✅ Token refreshed successfully');
    return data.access_token;
  }

  /**
   * Fetch all Gmail labels (folders)
   */
  async fetchFolders(): Promise<ProviderFolder[]> {
    console.log('📁 Fetching Gmail labels...');

    const response = await this.gmail.users.labels.list({
      userId: 'me',
    });

    const folders: ProviderFolder[] = (response.data.labels || []).map((label: any) => ({
      id: label.id!,
      name: label.name!,
      totalMessages: label.messagesTotal || 0,
      unreadMessages: label.messagesUnread || 0,
    }));

    console.log(`✅ Found ${folders.length} labels`);
    return folders;
  }

  /**
   * Fetch emails from Gmail with pagination
   */
  async fetchEmails(
    folderId: string,
    cursor?: string
  ): Promise<{
    emails: ProviderEmail[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    console.log(`📧 Fetching emails from label: ${folderId}`);

    // List message IDs
    const listResponse = await this.gmail.users.messages.list({
      userId: 'me',
      labelIds: [folderId],
      maxResults: 100,
      pageToken: cursor,
    });

    const messageIds = listResponse.data.messages || [];
    const nextPageToken = listResponse.data.nextPageToken;

    if (messageIds.length === 0) {
      return { emails: [], nextCursor: undefined, hasMore: false };
    }

    // Fetch full message details in batch
    const emails: ProviderEmail[] = [];
    for (const { id } of messageIds) {
      try {
        const msgResponse = await this.gmail.users.messages.get({
          userId: 'me',
          id: id!,
          format: 'full',
        });

        const providerEmail = this.mapToProviderEmail(msgResponse.data);
        emails.push(providerEmail);
      } catch (error) {
        console.error(`⚠️ Failed to fetch message ${id}:`, error);
        // Continue with other messages
      }
    }

    console.log(`✅ Fetched ${emails.length} emails from label ${folderId}`);

    return {
      emails,
      nextCursor: nextPageToken || undefined,
      hasMore: !!nextPageToken,
    };
  }

  /**
   * Map Gmail message to standard ProviderEmail format
   */
  private mapToProviderEmail(msg: gmail_v1.Schema$Message): ProviderEmail {
    const headers = msg.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

    return {
      id: msg.id!,
      messageId: getHeader('Message-ID') || msg.id!,
      subject: getHeader('Subject') || '(No Subject)',
      from: this.parseEmailAddress(getHeader('From')),
      to: this.parseEmailAddresses(getHeader('To')),
      cc: this.parseEmailAddresses(getHeader('Cc')),
      receivedAt: new Date(parseInt(msg.internalDate || '0')),
      sentAt: new Date(parseInt(msg.internalDate || '0')),
      bodyHtml: this.extractBody(msg.payload, 'text/html'),
      bodyText: this.extractBody(msg.payload, 'text/plain'),
      snippet: msg.snippet || '',
      isRead: !(msg.labelIds || []).includes('UNREAD'),
      hasAttachments: this.hasAttachments(msg.payload),
      labels: msg.labelIds || [],
    };
  }

  /**
   * Parse email address from string
   */
  private parseEmailAddress(str: string): EmailAddress {
    const match = str.match(/(.+?)\s*<(.+?)>/) || str.match(/(.+)/);
    if (!match) return { email: '' };

    if (match[2]) {
      return { name: match[1].trim(), email: match[2].trim() };
    }
    return { email: match[1].trim() };
  }

  /**
   * Parse multiple email addresses
   */
  private parseEmailAddresses(str: string): EmailAddress[] {
    if (!str) return [];
    return str.split(',').map((s) => this.parseEmailAddress(s.trim()));
  }

  /**
   * Extract email body from message payload
   */
  private extractBody(
    payload: gmail_v1.Schema$MessagePart | undefined,
    mimeType: string
  ): string | undefined {
    if (!payload) return undefined;

    // Check if this part matches the MIME type
    if (payload.mimeType === mimeType && payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    // Recursively check parts
    if (payload.parts) {
      for (const part of payload.parts) {
        const body = this.extractBody(part, mimeType);
        if (body) return body;
      }
    }

    return undefined;
  }

  /**
   * Check if message has attachments
   */
  private hasAttachments(payload: gmail_v1.Schema$MessagePart | undefined): boolean {
    if (!payload) return false;

    if (payload.filename && payload.filename.length > 0) {
      return true;
    }

    if (payload.parts) {
      return payload.parts.some((part) => this.hasAttachments(part));
    }

    return false;
  }
}

