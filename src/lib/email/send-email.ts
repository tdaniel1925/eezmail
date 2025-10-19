'use server';

/**
 * Unified Email Sending Service
 * Routes email sending to the correct provider (Gmail, Microsoft, IMAP)
 */

import { db } from '@/lib/db';
import { emailAccounts, emails } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { GmailService } from './gmail-api';
import { MicrosoftGraphService } from './microsoft-graph';
import { createClient } from '@/lib/supabase/server';

export interface SendEmailParams {
  accountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  attachments?: Array<{
    filename: string;
    content: string; // Base64 encoded
    contentType: string;
  }>;
  replyToMessageId?: string;
  threadId?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email via the appropriate provider
 */
export async function sendEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  try {
    // Get account details
    const account = await db.query.emailAccounts.findFirst({
      where: eq(emailAccounts.id, params.accountId),
    });

    if (!account) {
      return {
        success: false,
        error: 'Email account not found',
      };
    }

    if (account.status !== 'active') {
      return {
        success: false,
        error: 'Email account is not active',
      };
    }

    // Validate access token
    if (!account.accessToken) {
      return {
        success: false,
        error: 'No access token found. Please reconnect your email account.',
      };
    }

    // Route to appropriate provider
    switch (account.provider) {
      case 'gmail':
        return await sendViaGmail(account, params);
      case 'microsoft':
        return await sendViaMicrosoft(account, params);
      case 'imap':
        return await sendViaImap(account, params);
      default:
        return {
          success: false,
          error: `Unsupported provider: ${account.provider}`,
        };
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Send email via Gmail API
 */
async function sendViaGmail(
  account: any,
  params: SendEmailParams
): Promise<SendEmailResult> {
  try {
    const gmailService = new GmailService({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: process.env.GOOGLE_REDIRECT_URI!,
    });

    const result = await gmailService.sendEmail(account.accessToken, {
      to: params.to,
      cc: params.cc || [],
      bcc: params.bcc || [],
      subject: params.subject,
      body: params.body,
      isHtml: params.isHtml || false,
      attachments: params.attachments || [],
      inReplyTo: params.replyToMessageId,
      threadId: params.threadId,
    });

    // Save sent email to database
    await saveSentEmail(account.id, params, result.messageId);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('Gmail send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send via Gmail',
    };
  }
}

/**
 * Send email via Microsoft Graph API
 */
async function sendViaMicrosoft(
  account: any,
  params: SendEmailParams
): Promise<SendEmailResult> {
  try {
    const msService = new MicrosoftGraphService({
      clientId: process.env.AZURE_CLIENT_ID!,
      clientSecret: process.env.AZURE_CLIENT_SECRET!,
      redirectUri: process.env.AZURE_REDIRECT_URI!,
      tenantId: process.env.AZURE_TENANT_ID || 'common',
    });

    const result = await msService.sendEmail(account.accessToken, {
      to: params.to.map((email) => ({ email, name: '' })),
      cc: (params.cc || []).map((email) => ({ email, name: '' })),
      bcc: (params.bcc || []).map((email) => ({ email, name: '' })),
      subject: params.subject,
      body: params.body,
      isHtml: params.isHtml || false,
      attachments: params.attachments || [],
    });

    // Save sent email to database
    await saveSentEmail(account.id, params, result.messageId);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('Microsoft send error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to send via Microsoft',
    };
  }
}

/**
 * Send email via IMAP/SMTP
 */
async function sendViaImap(
  account: any,
  params: SendEmailParams
): Promise<SendEmailResult> {
  // TODO: Implement SMTP sending for IMAP accounts
  // This requires setting up nodemailer with SMTP credentials
  console.log('IMAP/SMTP sending not yet implemented');
  return {
    success: false,
    error: 'IMAP/SMTP sending not yet implemented',
  };
}

/**
 * Save sent email to database for history
 */
async function saveSentEmail(
  accountId: string,
  params: SendEmailParams,
  messageId: string
): Promise<void> {
  try {
    await db.insert(emails).values({
      accountId,
      messageId,
      threadId: params.threadId || messageId,
      subject: params.subject,
      snippet: params.body.substring(0, 200),
      fromAddress: {
        email: '', // Will be filled from account
        name: '',
      },
      toAddresses: params.to.map((email) => ({ email, name: '' })),
      ccAddresses: (params.cc || []).map((email) => ({ email, name: '' })),
      bccAddresses: (params.bcc || []).map((email) => ({ email, name: '' })),
      bodyText: params.isHtml ? '' : params.body,
      bodyHtml: params.isHtml ? params.body : '',
      receivedAt: new Date(),
      sentAt: new Date(),
      isRead: true,
      folderName: 'sent',
      hasAttachments: (params.attachments?.length || 0) > 0,
    });
  } catch (error) {
    console.error('Error saving sent email:', error);
    // Don't fail the send if we can't save it
  }
}

