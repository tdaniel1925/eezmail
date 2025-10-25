/**
 * Sandbox Service Credentials
 * Provides Twilio and OpenAI credentials for sandbox users from their company
 */

import { db } from '@/lib/db';
import { users, sandboxCompanies } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface SandboxCredentials {
  twilio?: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  };
  openai?: {
    apiKey: string;
    organizationId?: string;
  };
  unlimitedAccess: {
    sms: boolean;
    ai: boolean;
    storage: boolean;
  };
}

/**
 * Get sandbox credentials for a user
 * Returns company credentials if user is a sandbox user, otherwise null
 */
export async function getSandboxCredentials(
  userId: string
): Promise<SandboxCredentials | null> {
  try {
    // Get user with role and sandbox company ID
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        role: true,
        sandboxCompanyId: true,
      },
    });

    if (!user || user.role !== 'sandbox_user' || !user.sandboxCompanyId) {
      return null;
    }

    // Get sandbox company credentials
    const company = await db.query.sandboxCompanies.findFirst({
      where: eq(sandboxCompanies.id, user.sandboxCompanyId),
      columns: {
        twilioAccountSid: true,
        twilioAuthToken: true,
        twilioPhoneNumber: true,
        openaiApiKey: true,
        openaiOrganizationId: true,
        unlimitedSms: true,
        unlimitedAi: true,
        unlimitedStorage: true,
        status: true,
      },
    });

    if (!company || company.status !== 'active') {
      console.warn(`⚠️  Sandbox company inactive for user ${userId}`);
      return null;
    }

    const credentials: SandboxCredentials = {
      unlimitedAccess: {
        sms: company.unlimitedSms,
        ai: company.unlimitedAi,
        storage: company.unlimitedStorage,
      },
    };

    // Add Twilio credentials if available
    if (
      company.twilioAccountSid &&
      company.twilioAuthToken &&
      company.twilioPhoneNumber
    ) {
      credentials.twilio = {
        accountSid: company.twilioAccountSid,
        authToken: company.twilioAuthToken,
        phoneNumber: company.twilioPhoneNumber,
      };
    }

    // Add OpenAI credentials if available
    if (company.openaiApiKey) {
      credentials.openai = {
        apiKey: company.openaiApiKey,
        organizationId: company.openaiOrganizationId || undefined,
      };
    }

    return credentials;
  } catch (error) {
    console.error('Error fetching sandbox credentials:', error);
    return null;
  }
}

/**
 * Check if user has unlimited access to a service
 */
export async function hasUnlimitedAccess(
  userId: string,
  service: 'sms' | 'ai' | 'storage'
): Promise<boolean> {
  const credentials = await getSandboxCredentials(userId);

  if (!credentials) {
    return false;
  }

  return credentials.unlimitedAccess[service];
}

/**
 * Get Twilio credentials (sandbox or system)
 * Returns sandbox credentials if user is a sandbox user, otherwise system credentials
 */
export async function getTwilioCredentials(userId: string): Promise<{
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  isSandbox: boolean;
} | null> {
  // Try to get sandbox credentials first
  const sandboxCreds = await getSandboxCredentials(userId);

  if (sandboxCreds?.twilio) {
    console.log(`📞 [Twilio] Using sandbox credentials for user ${userId}`);
    return {
      ...sandboxCreds.twilio,
      isSandbox: true,
    };
  }

  // Fall back to system credentials from environment
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  ) {
    console.log(`📞 [Twilio] Using system credentials for user ${userId}`);
    return {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
      isSandbox: false,
    };
  }

  console.warn(`⚠️  [Twilio] No credentials available for user ${userId}`);
  return null;
}

/**
 * Get OpenAI credentials (sandbox or system)
 * Returns sandbox credentials if user is a sandbox user, otherwise system credentials
 */
export async function getOpenAICredentials(userId: string): Promise<{
  apiKey: string;
  organizationId?: string;
  isSandbox: boolean;
} | null> {
  // Try to get sandbox credentials first
  const sandboxCreds = await getSandboxCredentials(userId);

  if (sandboxCreds?.openai) {
    console.log(`🤖 [OpenAI] Using sandbox credentials for user ${userId}`);
    return {
      ...sandboxCreds.openai,
      isSandbox: true,
    };
  }

  // Fall back to system credentials from environment
  if (process.env.OPENAI_API_KEY) {
    console.log(`🤖 [OpenAI] Using system credentials for user ${userId}`);
    return {
      apiKey: process.env.OPENAI_API_KEY,
      organizationId: process.env.OPENAI_ORGANIZATION_ID,
      isSandbox: false,
    };
  }

  console.warn(`⚠️  [OpenAI] No credentials available for user ${userId}`);
  return null;
}

/**
 * Check if user should bypass quota limits
 */
export async function shouldBypassQuota(
  userId: string,
  service: 'sms' | 'ai' | 'storage'
): Promise<boolean> {
  return await hasUnlimitedAccess(userId, service);
}

/**
 * Track sandbox company usage (for monitoring, not limiting)
 */
export async function trackSandboxUsage(
  userId: string,
  service: 'sms' | 'ai' | 'storage',
  amount: number
): Promise<void> {
  try {
    // Get user's sandbox company
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        role: true,
        sandboxCompanyId: true,
      },
    });

    if (!user || user.role !== 'sandbox_user' || !user.sandboxCompanyId) {
      return;
    }

    // Get current company data
    const company = await db.query.sandboxCompanies.findFirst({
      where: eq(sandboxCompanies.id, user.sandboxCompanyId),
      columns: {
        totalSmsUsed: true,
        totalAiTokensUsed: true,
        totalStorageUsed: true,
      },
    });

    if (!company) {
      return;
    }

    // Calculate new value
    const updateData =
      service === 'sms'
        ? { totalSmsUsed: company.totalSmsUsed + amount }
        : service === 'ai'
          ? { totalAiTokensUsed: company.totalAiTokensUsed + amount }
          : { totalStorageUsed: company.totalStorageUsed + amount };

    // Update company usage
    await db
      .update(sandboxCompanies)
      .set(updateData)
      .where(eq(sandboxCompanies.id, user.sandboxCompanyId));

    console.log(
      `📊 [Sandbox Usage] Tracked ${amount} ${service} usage for company ${user.sandboxCompanyId}`
    );
  } catch (error) {
    console.error('Error tracking sandbox usage:', error);
    // Don't throw - tracking failure shouldn't block the action
  }
}


