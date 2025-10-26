/**
 * Google Gmail API Integration
 * Direct integration with Gmail API for Google accounts
 * Implements incremental authorization for better user experience
 */

export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Gmail OAuth Scope Sets
 * Organized by permission level for incremental authorization
 */
export const GMAIL_SCOPES = {
  // Base scopes - Always requested on initial auth
  BASE: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ],
  
  // Read-only access to emails
  READ: [
    'https://www.googleapis.com/auth/gmail.readonly',
  ],
  
  // Modify emails (mark as read, archive, delete)
  MODIFY: [
    'https://www.googleapis.com/auth/gmail.modify',
  ],
  
  // Send emails
  SEND: [
    'https://www.googleapis.com/auth/gmail.send',
  ],
  
  // Compose and draft management
  COMPOSE: [
    'https://www.googleapis.com/auth/gmail.compose',
  ],
} as const;

export type GmailScopeLevel = 'base' | 'read' | 'modify' | 'send' | 'compose';

export class GmailService {
  private config: GmailConfig;

  constructor(config: GmailConfig) {
    this.config = config;
  }

  /**
   * Generate OAuth URL for Gmail API with incremental authorization support
   * 
   * @param state - State parameter for OAuth flow
   * @param scopeLevels - Array of scope levels to request (default: ['base', 'read'])
   * @returns OAuth authorization URL
   * 
   * @example
   * // Initial connection - only request read access
   * const authUrl = gmail.generateAuthUrl(state, ['base', 'read']);
   * 
   * // Later, when user wants to send emails
   * const authUrl = gmail.generateAuthUrl(state, ['send']);
   */
  generateAuthUrl(
    state: string, 
    scopeLevels: GmailScopeLevel[] = ['base', 'read']
  ): string {
    // Build scope list based on requested levels
    const scopes: string[] = [];
    
    if (scopeLevels.includes('base')) {
      scopes.push(...GMAIL_SCOPES.BASE);
    }
    if (scopeLevels.includes('read')) {
      scopes.push(...GMAIL_SCOPES.READ);
    }
    if (scopeLevels.includes('modify')) {
      scopes.push(...GMAIL_SCOPES.MODIFY);
    }
    if (scopeLevels.includes('send')) {
      scopes.push(...GMAIL_SCOPES.SEND);
    }
    if (scopeLevels.includes('compose')) {
      scopes.push(...GMAIL_SCOPES.COMPOSE);
    }

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: scopes.join(' '),
      state: state,
      access_type: 'offline',
      prompt: 'consent',
      // KEY: Enable incremental authorization
      include_granted_scopes: 'true',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code: code,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Token refresh failed: ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken, // Google may not return new refresh token
      expiresIn: data.expires_in,
    };
  }

  /**
   * Get user profile from Gmail API
   */
  async getUserProfile(accessToken: string): Promise<{
    id: string;
    email: string;
    displayName: string;
  }> {
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/profile',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get user profile: ${response.statusText}`);
    }

    const profile = await response.json();
    return {
      id: profile.emailAddress,
      email: profile.emailAddress,
      displayName: profile.displayName || profile.emailAddress,
    };
  }

  /**
   * Get emails from Gmail API
   */
  async getEmails(accessToken: string, limit: number = 50): Promise<any[]> {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get emails: ${response.statusText}`);
    }

    const data = await response.json();
    return data.messages || [];
  }

  /**
   * Get email details from Gmail API
   */
  async getEmailDetails(accessToken: string, messageId: string): Promise<any> {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get email details: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Send email via Gmail API
   */
  async sendEmail(
    accessToken: string,
    message: {
      to: string;
      subject: string;
      body: string;
    }
  ): Promise<void> {
    const email = [
      `To: ${message.to}`,
      `Subject: ${message.subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      message.body,
    ].join('\n');

    const encodedEmail = Buffer.from(email).toString('base64url');

    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raw: encodedEmail,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }
  }
}
