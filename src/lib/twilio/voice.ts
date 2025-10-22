'use server';

/**
 * Twilio Voice Service
 * Handles voice calls and text-to-speech
 */

import { getTwilioClientForUser } from './client-factory';
import { validateE164PhoneNumber, formatPhoneNumber } from './client';
import { checkRateLimit, logCommunicationUsage } from '@/lib/communication/rate-limiter';

export interface VoiceCallResult {
  success: boolean;
  callSid?: string;
  error?: string;
  rateLimited?: boolean;
}

/**
 * Make a voice call with text-to-speech message
 */
export async function makeVoiceCall(
  userId: string,
  to: string,
  message: string,
  contactId?: string
): Promise<VoiceCallResult> {
  try {
    // Check rate limit first
    const rateCheck = await checkRateLimit(userId, 'voice_call');

    if (!rateCheck.allowed) {
      // Log rate limited attempt
      await logCommunicationUsage(userId, 'voice_call', to, 'rate_limited', {
        contactId,
        messagePreview: message.substring(0, 50),
        errorMessage: rateCheck.reason,
      });

      return {
        success: false,
        error: rateCheck.reason,
        rateLimited: true,
      };
    }

    // Format and validate phone number
    const formattedTo = formatPhoneNumber(to);

    if (!validateE164PhoneNumber(formattedTo)) {
      return {
        success: false,
        error: `Invalid phone number format: ${to}. Must be in E.164 format (e.g., +14155552671)`,
      };
    }

    // Get appropriate Twilio client
    const { client, config, isCustom } = await getTwilioClientForUser(userId);

    // Create TwiML for text-to-speech
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(message)}</Say>
  <Pause length="1"/>
  <Say voice="Polly.Joanna">This was a voice message from your contact management system.</Say>
</Response>`;

    // Make the call
    const result = await client.calls.create({
      twiml,
      to: formattedTo,
      from: config.phoneNumber,
    });

    // Calculate cost if using system Twilio
    // Twilio charges ~$0.013/minute for voice calls in US
    const cost = isCustom ? undefined : '0.013';

    // Log successful call
    await logCommunicationUsage(userId, 'voice_call', formattedTo, 'sent', {
      contactId,
      cost,
      usedCustomTwilio: isCustom,
      messagePreview: message.substring(0, 50),
    });

    console.log(`✅ Voice call initiated to ${formattedTo}: ${result.sid}`);

    return {
      success: true,
      callSid: result.sid,
    };
  } catch (error: any) {
    console.error('Voice call error:', error);

    // Log failed attempt
    await logCommunicationUsage(userId, 'voice_call', to, 'failed', {
      contactId,
      messagePreview: message.substring(0, 50),
      errorMessage: error.message || 'Unknown error',
    });

    return {
      success: false,
      error: error.message || 'Failed to make voice call',
    };
  }
}

/**
 * Send a pre-recorded voice message
 */
export async function sendVoiceMessage(
  userId: string,
  to: string,
  audioUrl: string,
  contactId?: string
): Promise<VoiceCallResult> {
  try {
    // Check rate limit first
    const rateCheck = await checkRateLimit(userId, 'voice_call');

    if (!rateCheck.allowed) {
      await logCommunicationUsage(userId, 'voice_call', to, 'rate_limited', {
        contactId,
        messagePreview: 'Pre-recorded message',
        errorMessage: rateCheck.reason,
      });

      return {
        success: false,
        error: rateCheck.reason,
        rateLimited: true,
      };
    }

    // Format and validate phone number
    const formattedTo = formatPhoneNumber(to);

    if (!validateE164PhoneNumber(formattedTo)) {
      return {
        success: false,
        error: `Invalid phone number format: ${to}`,
      };
    }

    // Get appropriate Twilio client
    const { client, config, isCustom } = await getTwilioClientForUser(userId);

    // Create TwiML to play the audio file
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${escapeXml(audioUrl)}</Play>
</Response>`;

    // Make the call
    const result = await client.calls.create({
      twiml,
      to: formattedTo,
      from: config.phoneNumber,
    });

    const cost = isCustom ? undefined : '0.013';

    await logCommunicationUsage(userId, 'voice_call', formattedTo, 'sent', {
      contactId,
      cost,
      usedCustomTwilio: isCustom,
      messagePreview: 'Pre-recorded message',
    });

    console.log(`✅ Voice message sent to ${formattedTo}: ${result.sid}`);

    return {
      success: true,
      callSid: result.sid,
    };
  } catch (error: any) {
    console.error('Voice message error:', error);

    await logCommunicationUsage(userId, 'voice_call', to, 'failed', {
      contactId,
      messagePreview: 'Pre-recorded message',
      errorMessage: error.message || 'Unknown error',
    });

    return {
      success: false,
      error: error.message || 'Failed to send voice message',
    };
  }
}

/**
 * Get voice call status from Twilio
 */
export async function getCallStatus(
  userId: string,
  callSid: string
): Promise<{
  success: boolean;
  status?: string;
  duration?: string;
  error?: string;
}> {
  try {
    const { client } = await getTwilioClientForUser(userId);

    const call = await client.calls(callSid).fetch();

    return {
      success: true,
      status: call.status,
      duration: call.duration || undefined,
    };
  } catch (error: any) {
    console.error('Failed to get call status:', error);
    return {
      success: false,
      error: error.message || 'Failed to get call status',
    };
  }
}

/**
 * Escape XML special characters for TwiML
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

