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
export function formatPhoneNumber(phoneNumber: string, defaultCountryCode: string = '+1'): string {
  // Remove all non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // If it doesn't start with +, add default country code
  if (!cleaned.startsWith('+')) {
    cleaned = defaultCountryCode + cleaned;
  }
  
  return cleaned;
}

