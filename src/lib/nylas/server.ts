/**
 * Nylas Server-side Client
 * Handles OAuth and email sync operations
 */

import Nylas from 'nylas';

if (!process.env.NYLAS_API_KEY) {
  throw new Error('Missing NYLAS_API_KEY environment variable');
}

if (!process.env.NYLAS_API_URI) {
  throw new Error('Missing NYLAS_API_URI environment variable');
}

// Initialize Nylas client
export const nylasClient = new Nylas({
  apiKey: process.env.NYLAS_API_KEY,
  apiUri: process.env.NYLAS_API_URI,
});

/**
 * Generate OAuth URL for email provider authorization
 */
export async function generateOAuthUrl(
  redirectUri: string,
  loginHint?: string
): Promise<{ url: string; state: string }> {
  const state = Math.random().toString(36).substring(7);

  // Try using Nylas hosted redirect URI instead of localhost
  const nylasRedirectUri = 'https://api.us.nylas.com/v3/connect/callback';

  const config = {
    clientId: process.env.NEXT_PUBLIC_NYLAS_CLIENT_ID!,
    redirectUri: nylasRedirectUri, // Use Nylas hosted redirect URI
    ...(loginHint && { loginHint }),
  };

  console.log('🔗 Using Nylas hosted redirect URI:', nylasRedirectUri);

  const url = nylasClient.auth.urlForOAuth2({
    ...config,
    state,
    scope: ['email', 'calendar', 'contacts'],
  });

  return { url, state };
}

/**
 * Exchange authorization code for access token
 * Returns grant info including email address
 */
export async function exchangeCodeForToken(code: string, redirectUri: string) {
  const response = await nylasClient.auth.exchangeCodeForToken({
    clientId: process.env.NEXT_PUBLIC_NYLAS_CLIENT_ID!,
    clientSecret: process.env.NYLAS_CLIENT_SECRET!,
    redirectUri,
    code,
  });

  console.log('Nylas token exchange response:', {
    grantId: response.grantId,
    email: response.email,
    provider: response.provider,
  });

  return response;
}

/**
 * Sync emails from Nylas
 */
export async function syncEmails(
  _accessToken: string,
  options?: {
    limit?: number;
    offset?: number;
    unread?: boolean;
  }
) {
  void _accessToken; // Mark as intentionally unused - will be used in production
  // Mock implementation for now
  // In production, use Nylas SDK:
  // const nylas = new Nylas({ apiKey: accessToken, apiUri: process.env.NYLAS_API_URI! });
  // return await nylas.messages.list({ identifier: grantId, queryParams });

  const queryParams: Record<string, unknown> = {
    ...(options?.unread !== undefined && { unread: options.unread }),
  };

  console.log('Syncing emails with params:', queryParams);
  return { data: [], nextCursor: null };
}

/**
 * Send email via Nylas
 */
export async function sendEmail(
  _accessToken: string,
  draft: {
    to: Array<{ email: string; name?: string }>;
    subject: string;
    body: string;
    cc?: Array<{ email: string; name?: string }>;
    bcc?: Array<{ email: string; name?: string }>;
    replyTo?: Array<{ email: string; name?: string }>;
  }
) {
  void _accessToken; // Mark as intentionally unused - will be used in production
  // Mock implementation - replace with actual Nylas SDK call
  console.log('Sending email:', draft);
  return { success: true, messageId: 'mock_message_id' };
}

/**
 * Mark email as read/unread
 */
export async function updateEmailReadStatus(
  _accessToken: string,
  messageId: string,
  unread: boolean
) {
  void _accessToken; // Mark as intentionally unused - will be used in production
  // Mock implementation for now
  // In production, use Nylas SDK:
  // const nylas = new Nylas({ apiKey: accessToken, apiUri: process.env.NYLAS_API_URI! });
  // return await nylas.messages.update({ identifier: grantId, messageId, requestBody: { unread } });

  console.log('Updating message', messageId, 'unread:', unread);
  return { success: true };
}

/**
 * Delete email
 */
export async function deleteEmail(_accessToken: string, messageId: string) {
  void _accessToken; // Mark as intentionally unused - will be used in production
  // Mock implementation for now
  // In production, use Nylas SDK:
  // const nylas = new Nylas({ apiKey: accessToken, apiUri: process.env.NYLAS_API_URI! });
  // return await nylas.messages.destroy({ identifier: grantId, messageId });

  console.log('Deleting message:', messageId);
  return { success: true };
}
