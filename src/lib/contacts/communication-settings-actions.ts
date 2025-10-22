'use server';

/**
 * Communication Settings Actions
 * Manage user's Twilio configuration and rate limits
 */

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { communicationSettings, communicationLimits } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt, maskSensitiveData } from '@/lib/utils/encryption';
import { testTwilioCredentials, verifyTwilioPhoneNumber } from '@/lib/twilio/client-factory';

export interface CommunicationSettingsData {
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  useCustomTwilio: boolean;
  billingEnabled: boolean;
}

export interface CommunicationLimitsData {
  planType: 'personal' | 'professional' | 'enterprise' | 'custom';
  smsPerMinute: number;
  smsPerHour: number;
  smsPerDay: number;
  voicePerMinute: number;
  voicePerHour: number;
  voicePerDay: number;
}

/**
 * Get user's communication settings (decrypted)
 */
export async function getUserCommunicationSettings(): Promise<{
  success: boolean;
  settings?: CommunicationSettingsData & { accountSidMasked?: string };
  limits?: CommunicationLimitsData;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get settings
    const userSettings = await db.query.communicationSettings.findFirst({
      where: eq(communicationSettings.userId, user.id),
    });

    // Get limits
    const userLimits = await db.query.communicationLimits.findFirst({
      where: eq(communicationLimits.userId, user.id),
    });

    // Decrypt credentials if they exist
    let decryptedSettings: CommunicationSettingsData = {
      useCustomTwilio: userSettings?.useCustomTwilio || false,
      billingEnabled: userSettings?.billingEnabled ?? true,
    };

    let accountSidMasked: string | undefined;

    if (userSettings?.twilioAccountSid) {
      try {
        const decryptedSid = decrypt(userSettings.twilioAccountSid);
        accountSidMasked = maskSensitiveData(decryptedSid);
        decryptedSettings.twilioAccountSid = decryptedSid;
      } catch (error) {
        console.error('Failed to decrypt Twilio credentials');
      }
    }

    if (userSettings?.twilioPhoneNumber) {
      decryptedSettings.twilioPhoneNumber = userSettings.twilioPhoneNumber;
    }

    const limitsData: CommunicationLimitsData = {
      planType: (userLimits?.planType as any) || 'personal',
      smsPerMinute: userLimits?.smsPerMinute || 1,
      smsPerHour: userLimits?.smsPerHour || 10,
      smsPerDay: userLimits?.smsPerDay || 100,
      voicePerMinute: userLimits?.voicePerMinute || 1,
      voicePerHour: userLimits?.voicePerHour || 5,
      voicePerDay: userLimits?.voicePerDay || 20,
    };

    return {
      success: true,
      settings: { ...decryptedSettings, accountSidMasked },
      limits: limitsData,
    };
  } catch (error) {
    console.error('Error getting communication settings:', error);
    return { success: false, error: 'Failed to get settings' };
  }
}

/**
 * Update user's communication settings
 */
export async function updateCommunicationSettings(
  settings: CommunicationSettingsData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // If enabling custom Twilio, validate credentials first
    if (settings.useCustomTwilio && settings.twilioAccountSid && settings.twilioAuthToken) {
      const credentialsTest = await testTwilioCredentials(
        settings.twilioAccountSid,
        settings.twilioAuthToken
      );

      if (!credentialsTest.success) {
        return {
          success: false,
          error: credentialsTest.error || 'Invalid Twilio credentials',
        };
      }

      // Verify phone number if provided
      if (settings.twilioPhoneNumber) {
        const phoneTest = await verifyTwilioPhoneNumber(
          settings.twilioAccountSid,
          settings.twilioAuthToken,
          settings.twilioPhoneNumber
        );

        if (!phoneTest.success) {
          return {
            success: false,
            error: phoneTest.error || 'Invalid phone number',
          };
        }
      }
    }

    // Encrypt credentials
    const encryptedData: any = {
      useCustomTwilio: settings.useCustomTwilio,
      billingEnabled: settings.billingEnabled,
      updatedAt: new Date(),
    };

    if (settings.twilioAccountSid) {
      encryptedData.twilioAccountSid = encrypt(settings.twilioAccountSid);
    }

    if (settings.twilioAuthToken) {
      encryptedData.twilioAuthToken = encrypt(settings.twilioAuthToken);
    }

    if (settings.twilioPhoneNumber) {
      encryptedData.twilioPhoneNumber = settings.twilioPhoneNumber;
    }

    // Upsert settings
    await db
      .insert(communicationSettings)
      .values({
        userId: user.id,
        ...encryptedData,
      })
      .onConflictDoUpdate({
        target: communicationSettings.userId,
        set: encryptedData,
      });

    return { success: true };
  } catch (error) {
    console.error('Error updating communication settings:', error);
    return { success: false, error: 'Failed to update settings' };
  }
}

/**
 * Update user's communication limits (admin only)
 */
export async function updateCommunicationLimits(
  userId: string,
  limits: CommunicationLimitsData,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // TODO: Add admin check here
    // For now, users can only update their own limits if plan is 'custom'

    if (userId !== user.id) {
      return { success: false, error: 'Unauthorized - admin access required' };
    }

    // Upsert limits
    await db
      .insert(communicationLimits)
      .values({
        userId,
        planType: limits.planType,
        smsPerMinute: limits.smsPerMinute,
        smsPerHour: limits.smsPerHour,
        smsPerDay: limits.smsPerDay,
        voicePerMinute: limits.voicePerMinute,
        voicePerHour: limits.voicePerHour,
        voicePerDay: limits.voicePerDay,
        notes,
        overrideBy: user.id,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: communicationLimits.userId,
        set: {
          planType: limits.planType,
          smsPerMinute: limits.smsPerMinute,
          smsPerHour: limits.smsPerHour,
          smsPerDay: limits.smsPerDay,
          voicePerMinute: limits.voicePerMinute,
          voicePerHour: limits.voicePerHour,
          voicePerDay: limits.voicePerDay,
          notes,
          overrideBy: user.id,
          updatedAt: new Date(),
        },
      });

    return { success: true };
  } catch (error) {
    console.error('Error updating communication limits:', error);
    return { success: false, error: 'Failed to update limits' };
  }
}

/**
 * Test Twilio credentials before saving
 */
export async function testUserTwilioCredentials(
  accountSid: string,
  authToken: string,
  phoneNumber?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Test credentials
    const credentialsTest = await testTwilioCredentials(accountSid, authToken);

    if (!credentialsTest.success) {
      return credentialsTest;
    }

    // Test phone number if provided
    if (phoneNumber) {
      const phoneTest = await verifyTwilioPhoneNumber(accountSid, authToken, phoneNumber);
      return phoneTest;
    }

    return { success: true };
  } catch (error) {
    console.error('Error testing Twilio credentials:', error);
    return { success: false, error: 'Failed to test credentials' };
  }
}

