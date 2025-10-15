/**
 * Microsoft Graph API Integration
 * Direct integration with Microsoft Graph for Outlook accounts
 */

import { Client } from '@microsoft/microsoft-graph-client';

export interface MicrosoftGraphConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
}

export class MicrosoftGraphService {
  private config: MicrosoftGraphConfig;

  constructor(config: MicrosoftGraphConfig) {
    this.config = config;
  }

  /**
   * Generate OAuth URL for Microsoft Graph
   */
  generateAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope:
        'https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/User.Read offline_access',
      state: state,
      response_mode: 'query',
      prompt: 'select_account', // Let user choose which account
    });

    // CRITICAL: Use 'common' for multi-tenant, NOT specific tenant ID
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const response = await fetch(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token', // Use 'common' endpoint
      {
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
      }
    );

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
    const response = await fetch(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      {
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
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Token refresh failed: ${response.statusText} - ${errorData.error_description || ''}`
      );
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken, // Use new refresh token if provided, otherwise keep existing
      expiresIn: data.expires_in,
    };
  }

  /**
   * Get user profile from Microsoft Graph
   */
  async getUserProfile(accessToken: string): Promise<{
    id: string;
    email: string;
    displayName: string;
  }> {
    // Use direct fetch instead of Microsoft Graph SDK to avoid provider issues
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user profile: ${response.statusText}`);
    }

    const user = await response.json();
    return {
      id: user.id,
      email: user.mail || user.userPrincipalName,
      displayName: user.displayName,
    };
  }

  /**
   * Get emails from Microsoft Graph
   */
  async getEmails(accessToken: string, limit: number = 50): Promise<any[]> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages?$top=${limit}&$select=id,subject,from,receivedDateTime,isRead,bodyPreview`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get emails: ${response.statusText}`);
    }

    const data = await response.json();
    return data.value || [];
  }

  /**
   * Send email via Microsoft Graph
   */
  async sendEmail(
    accessToken: string,
    message: {
      to: string[];
      subject: string;
      body: string;
    }
  ): Promise<void> {
    const response = await fetch(
      'https://graph.microsoft.com/v1.0/me/sendMail',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            subject: message.subject,
            body: {
              contentType: 'HTML',
              content: message.body,
            },
            toRecipients: message.to.map((email) => ({
              emailAddress: { address: email },
            })),
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`);
    }
  }
}
