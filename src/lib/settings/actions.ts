'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { users, emailSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  accountSettingsSchema,
  passwordChangeSchema,
  emailPreferencesSchema,
  aiPreferencesSchema,
  notificationPreferencesSchema,
  privacySettingsSchema,
  type SettingsResponse,
  type AccountSettings,
  type EmailPreferences,
  type AIPreferences,
  type NotificationPreferences,
  type PrivacySettings,
} from './types';

// ============================================================================
// ACCOUNT SETTINGS ACTIONS
// ============================================================================

export async function updateAccountSettings(
  data: unknown
): Promise<SettingsResponse<AccountSettings>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate input
    const validation = accountSettingsSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        errors: validation.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const validated = validation.data;

    // Update user in database
    await db
      .update(users)
      .set({
        fullName: validated.fullName,
        email: validated.email,
        avatarUrl: validated.avatarUrl || null,
        updatedAt: new Date(),
      } as Partial<typeof users.$inferInsert>)
      .where(eq(users.id, user.id));

    // Also update Supabase Auth email if changed
    if (validated.email !== user.email) {
      const { error } = await supabase.auth.updateUser({
        email: validated.email,
      });

      if (error) {
        return {
          success: false,
          error: `Failed to update email: ${error.message}`,
        };
      }
    }

    revalidatePath('/dashboard/settings');

    return { success: true, data: validated };
  } catch (error) {
    console.error('Error updating account settings:', error);
    return {
      success: false,
      error: 'Failed to update account settings',
    };
  }
}

export async function changePassword(
  data: unknown
): Promise<SettingsResponse<{ message: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate input
    const validation = passwordChangeSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        errors: validation.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const validated = validation.data;

    // Update password in Supabase Auth
    const { error } = await supabase.auth.updateUser({
      password: validated.newPassword,
    });

    if (error) {
      return {
        success: false,
        error: `Failed to update password: ${error.message}`,
      };
    }

    return {
      success: true,
      data: { message: 'Password updated successfully' },
    };
  } catch (error) {
    console.error('Error changing password:', error);
    return {
      success: false,
      error: 'Failed to change password',
    };
  }
}

// ============================================================================
// EMAIL PREFERENCES ACTIONS
// ============================================================================

export async function updateEmailPreferences(
  accountId: string,
  data: unknown
): Promise<SettingsResponse<EmailPreferences>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate input
    const validation = emailPreferencesSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        errors: validation.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const validated = validation.data;

    // Update or create email settings
    const existing = await db.query.emailSettings.findFirst({
      where: (settings, { eq }) => eq(settings.accountId, accountId),
    });

    if (existing) {
      await db
        .update(emailSettings)
        .set({
          ...validated,
          updatedAt: new Date(),
        } as Partial<typeof emailSettings.$inferInsert>)
        .where(eq(emailSettings.accountId, accountId));
    } else {
      await db.insert(emailSettings).values({
        accountId,
        ...validated,
      } as typeof emailSettings.$inferInsert);
    }

    revalidatePath('/dashboard/settings');

    return { success: true, data: validated };
  } catch (error) {
    console.error('Error updating email preferences:', error);
    return {
      success: false,
      error: 'Failed to update email preferences',
    };
  }
}

// ============================================================================
// AI PREFERENCES ACTIONS
// ============================================================================

export async function updateAIPreferences(
  accountId: string,
  data: unknown
): Promise<SettingsResponse<AIPreferences>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate input
    const validation = aiPreferencesSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        errors: validation.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const validated = validation.data;

    // Update email settings
    await db
      .update(emailSettings)
      .set({
        enableAiSummaries: validated.enableAiSummaries,
        enableQuickReplies: validated.enableQuickReplies,
        enableSmartActions: validated.enableSmartActions,
        aiTone: validated.aiTone,
        autoClassifyAfterDays: validated.autoClassifyAfterDays,
        bulkEmailDetection: validated.bulkEmailDetection,
        emailMode: validated.emailMode,
        updatedAt: new Date(),
      } as Partial<typeof emailSettings.$inferInsert>)
      .where(eq(emailSettings.accountId, accountId));

    revalidatePath('/dashboard/settings');

    return { success: true, data: validated };
  } catch (error) {
    console.error('Error updating AI preferences:', error);
    return {
      success: false,
      error: 'Failed to update AI preferences',
    };
  }
}

// ============================================================================
// NOTIFICATION PREFERENCES ACTIONS
// ============================================================================

export async function updateNotificationPreferences(
  accountId: string,
  data: unknown
): Promise<SettingsResponse<NotificationPreferences>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate input
    const validation = notificationPreferencesSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        errors: validation.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const validated = validation.data;

    // Update email settings
    await db
      .update(emailSettings)
      .set({
        desktopNotifications: validated.desktopNotifications,
        soundEnabled: validated.soundEnabled,
        notifyOnImportantOnly: validated.notifyOnImportantOnly,
        updatedAt: new Date(),
      } as Partial<typeof emailSettings.$inferInsert>)
      .where(eq(emailSettings.accountId, accountId));

    revalidatePath('/dashboard/settings');

    return { success: true, data: validated };
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return {
      success: false,
      error: 'Failed to update notification preferences',
    };
  }
}

// ============================================================================
// PRIVACY SETTINGS ACTIONS
// ============================================================================

export async function updatePrivacySettings(
  accountId: string,
  data: unknown
): Promise<SettingsResponse<PrivacySettings>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate input
    const validation = privacySettingsSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        errors: validation.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const validated = validation.data;

    // Update email settings
    await db
      .update(emailSettings)
      .set({
        blockTrackers: validated.blockTrackers,
        blockExternalImages: validated.blockExternalImages,
        stripUtmParameters: validated.stripUtmParameters,
        updatedAt: new Date(),
      } as Partial<typeof emailSettings.$inferInsert>)
      .where(eq(emailSettings.accountId, accountId));

    revalidatePath('/dashboard/settings');

    return { success: true, data: validated };
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    return {
      success: false,
      error: 'Failed to update privacy settings',
    };
  }
}

// ============================================================================
// DELETE ACCOUNT ACTION
// ============================================================================

export async function deleteAccount(): Promise<
  SettingsResponse<{ message: string }>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Delete user from database (cascade will handle related records)
    await db.delete(users).where(eq(users.id, user.id));

    // Sign out from Supabase
    await supabase.auth.signOut();

    return { success: true, data: { message: 'Account deleted successfully' } };
  } catch (error) {
    console.error('Error deleting account:', error);
    return {
      success: false,
      error: 'Failed to delete account',
    };
  }
}
