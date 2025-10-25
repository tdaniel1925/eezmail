'use server';

/**
 * Twilio Client Factory
 * Determines whether to use sandbox, custom, or system Twilio account
 * Priority: Sandbox > Custom > System
 */

import { db } from '@/lib/db';
import { communicationSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt } from '@/lib/utils/encryption';
import { createTwilioClient, getSystemTwilioConfig, type TwilioConfig } from './client';
import { getTwilioCredentials } from '@/lib/sandbox/credentials';

export interface TwilioClientResult {
  client: ReturnType<typeof createTwilioClient>;
  config: TwilioConfig;
  isCustom: boolean;
  isSandbox: boolean;
}

/**
 * Get appropriate Twilio client for a user
 * Priority: Sandbox > Custom > System
 */
export async function getTwilioClientForUser(userId: string): Promise<TwilioClientResult> {
  try {
    // 1. Check for sandbox credentials first (highest priority)
    const sandboxCreds = await getTwilioCredentials(userId);

    if (sandboxCreds?.isSandbox) {
      const config: TwilioConfig = {
        accountSid: sandboxCreds.accountSid,
        authToken: sandboxCreds.authToken,
        phoneNumber: sandboxCreds.phoneNumber,
      };

      const client = createTwilioClient(config);

      console.log(`🧪 Using sandbox Twilio for user ${userId}`);

      return {
        client,
        config,
        isCustom: false,
        isSandbox: true,
      };
    }

    // 2. Check if user has custom Twilio configuration
    const userSettings = await db.query.communicationSettings.findFirst({
      where: eq(communicationSettings.userId, userId),
    });

    // If user has custom Twilio enabled and configured
    if (
      userSettings?.useCustomTwilio &&
      userSettings.twilioAccountSid &&
      userSettings.twilioAuthToken &&
      userSettings.twilioPhoneNumber
    ) {
      try {
        // Decrypt credentials
        const config: TwilioConfig = {
          accountSid: decrypt(userSettings.twilioAccountSid),
          authToken: decrypt(userSettings.twilioAuthToken),
          phoneNumber: userSettings.twilioPhoneNumber, // Phone number not encrypted
        };

        const client = createTwilioClient(config);

        console.log(`✅ Using custom Twilio for user ${userId}`);

        return {
          client,
          config,
          isCustom: true,
          isSandbox: false,
        };
      } catch (error) {
        console.error('Failed to decrypt user Twilio credentials:', error);
        // Fall through to system Twilio
      }
    }

    // 3. Use system Twilio (fallback)
    const config = getSystemTwilioConfig();
    const client = createTwilioClient(config);

    console.log(`✅ Using system Twilio for user ${userId}`);

    return {
      client,
      config,
      isCustom: false,
      isSandbox: false,
    };
  } catch (error) {
    console.error('Error getting Twilio client:', error);
    throw new Error('Failed to initialize Twilio client');
  }
}

/**
 * Test Twilio credentials by attempting to fetch account info
 */
export async function testTwilioCredentials(
  accountSid: string,
  authToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createTwilioClient({ accountSid, authToken, phoneNumber: '' });

    // Try to fetch account info to validate credentials
    await client.api.accounts(accountSid).fetch();

    return { success: true };
  } catch (error: any) {
    console.error('Twilio credential test failed:', error);

    let errorMessage = 'Invalid Twilio credentials';

    if (error.status === 401) {
      errorMessage = 'Invalid Account SID or Auth Token';
    } else if (error.status === 404) {
      errorMessage = 'Account not found';
    } else if (error.code) {
      errorMessage = `Twilio error: ${error.message}`;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Verify a phone number belongs to a Twilio account
 */
export async function verifyTwilioPhoneNumber(
  accountSid: string,
  authToken: string,
  phoneNumber: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = createTwilioClient({ accountSid, authToken, phoneNumber });

    // Fetch incoming phone numbers
    const numbers = await client.incomingPhoneNumbers.list();

    // Check if the phone number exists in the account
    const found = numbers.some((num) => num.phoneNumber === phoneNumber);

    if (!found) {
      return {
        success: false,
        error: `Phone number ${phoneNumber} not found in Twilio account`,
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Phone number verification failed:', error);
    return {
      success: false,
      error: `Failed to verify phone number: ${error.message}`,
    };
  }
}

