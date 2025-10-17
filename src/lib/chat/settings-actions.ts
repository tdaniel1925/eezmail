'use server';

import { db } from '@/lib/db';
import {
  emailAccounts,
  emailSettings,
  emailSignatures,
  emailRules,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

/**
 * Update email signature
 */
export async function updateSignature(params: {
  userId: string;
  accountId: string;
  signature: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, message: 'Unauthorized' };
    }

    // Update account signature
    await db
      .update(emailAccounts)
      .set({ signature: params.signature, updatedAt: new Date() } as any)
      .where(eq(emailAccounts.id, params.accountId));

    return {
      success: true,
      message: 'Signature updated',
    };
  } catch (error) {
    console.error('Error updating signature:', error);
    return { success: false, message: 'Failed to update signature' };
  }
}

/**
 * Update email rule
 */
export async function updateEmailRule(params: {
  userId: string;
  ruleId: string;
  updates: Record<string, any>;
}): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, message: 'Unauthorized' };
    }

    // Verify rule ownership
    const rule = await db.query.emailRules.findFirst({
      where: eq(emailRules.id, params.ruleId),
    });

    if (!rule || rule.userId !== params.userId) {
      return { success: false, message: 'Rule not found' };
    }

    // Update rule
    await db
      .update(emailRules)
      .set({ ...params.updates, updatedAt: new Date() } as any)
      .where(eq(emailRules.id, params.ruleId));

    return {
      success: true,
      message: `Updated rule "${rule.name}"`,
    };
  } catch (error) {
    console.error('Error updating rule:', error);
    return { success: false, message: 'Failed to update rule' };
  }
}

/**
 * Delete email rule
 */
export async function deleteEmailRule(params: {
  userId: string;
  ruleId: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, message: 'Unauthorized' };
    }

    // Verify rule ownership
    const rule = await db.query.emailRules.findFirst({
      where: eq(emailRules.id, params.ruleId),
    });

    if (!rule || rule.userId !== params.userId) {
      return { success: false, message: 'Rule not found' };
    }

    // Delete rule
    await db.delete(emailRules).where(eq(emailRules.id, params.ruleId));

    return {
      success: true,
      message: `Deleted rule "${rule.name}"`,
    };
  } catch (error) {
    console.error('Error deleting rule:', error);
    return { success: false, message: 'Failed to delete rule' };
  }
}

/**
 * List all active rules
 */
export async function listActiveRules(params: {
  userId: string;
}): Promise<{ success: boolean; rules: any[]; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, rules: [], message: 'Unauthorized' };
    }

    const rules = await db.query.emailRules.findMany({
      where: eq(emailRules.userId, params.userId),
      orderBy: (rules, { asc }) => [asc(rules.priority)],
    });

    return {
      success: true,
      rules,
      message: `Found ${rules.length} rules`,
    };
  } catch (error) {
    console.error('Error listing rules:', error);
    return { success: false, rules: [], message: 'Failed to list rules' };
  }
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(params: {
  userId: string;
  accountId: string;
  settings: {
    desktopNotifications?: boolean;
    soundEnabled?: boolean;
    notifyOnImportantOnly?: boolean;
  };
}): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, message: 'Unauthorized' };
    }

    // Update email settings
    await db
      .update(emailSettings)
      .set({ ...params.settings, updatedAt: new Date() } as any)
      .where(eq(emailSettings.accountId, params.accountId));

    return {
      success: true,
      message: 'Notification settings updated',
    };
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return { success: false, message: 'Failed to update settings' };
  }
}

/**
 * Update display preferences
 */
export async function updateDisplayPreferences(params: {
  userId: string;
  accountId: string;
  preferences: {
    theme?: string;
    density?: string;
    emailsPerPage?: number;
    readingPanePosition?: string;
  };
}): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return { success: false, message: 'Unauthorized' };
    }

    // Update email settings
    await db
      .update(emailSettings)
      .set({ ...params.preferences, updatedAt: new Date() } as any)
      .where(eq(emailSettings.accountId, params.accountId));

    return {
      success: true,
      message: 'Display preferences updated',
    };
  } catch (error) {
    console.error('Error updating display preferences:', error);
    return { success: false, message: 'Failed to update preferences' };
  }
}

