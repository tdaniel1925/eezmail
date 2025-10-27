'use server';

/**
 * Twilio SMS Service
 * Handles sending SMS messages with sandbox support
 */

import { getTwilioClientForUser } from './client-factory';
import { validateE164PhoneNumber, formatPhoneNumber } from './client';
import {
  checkRateLimit,
  logCommunicationUsage,
} from '@/lib/communication/rate-limiter';
import {
  shouldBypassQuota,
  trackSandboxUsage,
} from '@/lib/sandbox/credentials';

export interface SendSMSResult {
  success: boolean;
  messageSid?: string;
  error?: string;
  rateLimited?: boolean;
}

/**
 * Send SMS to a single recipient
 */
export async function sendSMS(
  userId: string,
  to: string,
  message: string,
  contactId?: string
): Promise<SendSMSResult> {
  try {
    // Check if user should bypass quota (sandbox users)
    const bypassQuota = await shouldBypassQuota(userId, 'sms');

    // Check rate limit only for non-sandbox users
    if (!bypassQuota) {
      const rateCheck = await checkRateLimit(userId, 'sms');

      if (!rateCheck.allowed) {
        // Log rate limited attempt
        await logCommunicationUsage(userId, 'sms', to, 'rate_limited', {
          contactId,
          messagePreview: message ? message.substring(0, 50) : '',
          errorMessage: rateCheck.reason,
        });

        return {
          success: false,
          error: rateCheck.reason,
          rateLimited: true,
        };
      }
    } else {
      console.log(`🧪 [Sandbox] Bypassing SMS rate limit for user ${userId}`);
    }

    // Format and validate phone number
    const formattedTo = formatPhoneNumber(to);

    console.log('📱 SMS Debug:', {
      originalPhone: to,
      formattedPhone: formattedTo,
      isValid: validateE164PhoneNumber(formattedTo),
      isSandboxUser: bypassQuota,
    });

    if (!validateE164PhoneNumber(formattedTo)) {
      return {
        success: false,
        error: `Invalid phone number format: ${to}. Must be in E.164 format (e.g., +14155552671)`,
      };
    }

    // Get appropriate Twilio client (sandbox, custom, or system)
    const { client, config, isCustom, isSandbox } =
      await getTwilioClientForUser(userId);

    // Build status callback URL for delivery tracking (only in production)
    const isProduction = process.env.NODE_ENV === 'production';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const callbackUrl =
      isProduction && appUrl && !appUrl.includes('localhost')
        ? `${appUrl}/api/twilio/status-callback`
        : undefined;

    console.log('📲 SMS Callback Config:', {
      isProduction,
      appUrl,
      hasCallback: !!callbackUrl,
    });

    // Send SMS with status callback (if available)
    const result = await client.messages.create({
      body: message,
      from: config.phoneNumber,
      to: formattedTo,
      ...(callbackUrl && { statusCallback: callbackUrl }),
    });

    console.log('📤 SMS sent with delivery tracking:', {
      messageSid: result.sid,
      to: formattedTo,
      status: result.status,
      hasCallback: !!callbackUrl,
    });

    // Calculate cost if using system Twilio
    // Twilio charges ~$0.0075 per SMS in US, varies by country
    const cost = isCustom ? undefined : '0.0075';

    // Track sandbox usage if applicable (non-blocking)
    if (isSandbox) {
      await trackSandboxUsage(userId, 'sms', 1);
    }

    // Log successful send
    await logCommunicationUsage(userId, 'sms', formattedTo, 'sent', {
      contactId,
      cost,
      usedCustomTwilio: isCustom,
      usedSandboxTwilio: isSandbox,
      messagePreview: message ? message.substring(0, 50) : '',
    });

    console.log(
      `✅ SMS sent to ${formattedTo}: ${result.sid}${isSandbox ? ' (sandbox)' : ''}`
    );

    return {
      success: true,
      messageSid: result.sid,
    };
  } catch (error: any) {
    console.error('SMS send error:', error);

    // Log failed attempt
    await logCommunicationUsage(userId, 'sms', to, 'failed', {
      contactId,
      messagePreview: message ? message.substring(0, 50) : '',
      errorMessage: error.message || 'Unknown error',
    });

    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    };
  }
}

/**
 * Send SMS to multiple recipients (bulk send)
 */
export async function sendBulkSMS(
  userId: string,
  recipients: Array<{ phone: string; contactId?: string }>,
  message: string
): Promise<{
  success: boolean;
  results: Array<{
    phone: string;
    success: boolean;
    error?: string;
    messageSid?: string;
  }>;
  summary: {
    total: number;
    sent: number;
    failed: number;
    rateLimited: number;
  };
}> {
  // Limit bulk sends to prevent abuse
  if (recipients.length > 50) {
    return {
      success: false,
      results: [],
      summary: {
        total: recipients.length,
        sent: 0,
        failed: recipients.length,
        rateLimited: 0,
      },
    };
  }

  const results: Array<{
    phone: string;
    success: boolean;
    error?: string;
    messageSid?: string;
  }> = [];

  let sentCount = 0;
  let failedCount = 0;
  let rateLimitedCount = 0;

  // Send to each recipient
  for (const recipient of recipients) {
    const result = await sendSMS(
      userId,
      recipient.phone,
      message,
      recipient.contactId
    );

    results.push({
      phone: recipient.phone,
      success: result.success,
      error: result.error,
      messageSid: result.messageSid,
    });

    if (result.success) {
      sentCount++;
    } else if (result.rateLimited) {
      rateLimitedCount++;
      // Stop sending if rate limited
      break;
    } else {
      failedCount++;
    }

    // Small delay between sends to avoid overwhelming Twilio API
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return {
    success: sentCount > 0,
    results,
    summary: {
      total: recipients.length,
      sent: sentCount,
      failed: failedCount,
      rateLimited: rateLimitedCount,
    },
  };
}

/**
 * Get SMS delivery status from Twilio
 */
export async function getSMSStatus(
  userId: string,
  messageSid: string
): Promise<{
  success: boolean;
  status?: string;
  error?: string;
}> {
  try {
    const { client } = await getTwilioClientForUser(userId);

    const message = await client.messages(messageSid).fetch();

    return {
      success: true,
      status: message.status,
    };
  } catch (error: any) {
    console.error('Failed to get SMS status:', error);
    return {
      success: false,
      error: error.message || 'Failed to get SMS status',
    };
  }
}
