/**
 * Twilio Client - Base configuration
 * Handles Twilio SDK initialization
 */

import twilio from 'twilio';

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

/**
 * Create a Twilio client with given credentials
 */
export function createTwilioClient(config: TwilioConfig) {
  if (!config.accountSid || !config.authToken) {
    throw new Error('Twilio credentials are required');
  }

  return twilio(config.accountSid, config.authToken);
}

/**
 * Get system-wide Twilio configuration from environment
 */
export function getSystemTwilioConfig(): TwilioConfig {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !phoneNumber) {
    throw new Error(
      'System Twilio configuration missing. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in environment variables.'
    );
  }

  return {
    accountSid,
    authToken,
    phoneNumber,
  };
}

/**
 * Validate phone number format (E.164)
 * Example: +14155552671
 */
export function validateE164PhoneNumber(phoneNumber: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * Format phone number to E.164 if needed
 * Attempts to add country code if missing
 */
export function formatPhoneNumber(
  phoneNumber: string,
  defaultCountryCode: string = '+1'
): string {
  // Remove all non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');

  // If it already starts with +, return as-is
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // If it starts with 1 and is 11 digits (US number), add + prefix
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    return '+' + cleaned;
  }

  // If it's 10 digits (US number without country code), add +1
  if (cleaned.length === 10) {
    return defaultCountryCode + cleaned;
  }

  // Otherwise, add the default country code
  return defaultCountryCode + cleaned;
}

/**
 * Validate Twilio configuration
 * Returns validation result without throwing
 */
export function validateTwilioConfig(): { valid: boolean; error?: string } {
  try {
    const config = getSystemTwilioConfig();
    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}
