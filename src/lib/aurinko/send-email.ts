/**
 * Aurinko Email Sending Service
 * Handles sending emails via Aurinko API for IMAP and alternative providers
 */

import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface AurinkoSendParams {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  attachments?: Array<{
    filename: string;
    content: string; // Base64
    contentType: string;
  }>;
  inReplyTo?: string;
  threadId?: string;
}

export interface AurinkoSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email via Aurinko API
 */
export async function sendViaAurinko(
  accountId: string,
  params: AurinkoSendParams
): Promise<AurinkoSendResult> {
  try {
    console.log(`🔵 Sending email via Aurinko for account: ${accountId}`);

    // Get account from database
    const account = await db.query.emailAccounts.findFirst({
      where: eq(emailAccounts.id, accountId),
    });

    if (!account || !account.useAurinko || !account.aurinkoAccessToken) {
      return { success: false, error: 'Not an Aurinko account' };
    }

    // Prepare email payload
    const emailPayload = {
      to: params.to.map((email) => ({ email })),
      cc: params.cc?.map((email) => ({ email })),
      bcc: params.bcc?.map((email) => ({ email })),
      subject: params.subject,
      body: params.body,
      bodyType: params.isHtml ? 'Html' : 'Text',
      attachments: params.attachments?.map((att) => ({
        name: att.filename,
        contentBytes: att.content,
        contentType: att.contentType,
      })),
      inReplyTo: params.inReplyTo,
      conversationId: params.threadId,
    };

    // Send email via Aurinko API
    const response = await fetch('https://api.aurinko.io/v1/email/messages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.aurinkoAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Aurinko send error:', errorText);
      return {
        success: false,
        error: `Failed to send: ${response.status} ${response.statusText}`,
      };
    }

    const result = await response.json();

    console.log('✅ Email sent via Aurinko:', result.id);

    return {
      success: true,
      messageId: result.id,
    };
  } catch (error) {
    console.error('❌ Error sending via Aurinko:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
