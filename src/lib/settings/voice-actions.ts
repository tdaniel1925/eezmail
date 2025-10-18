'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface VoiceSettings {
  recordingQuality: 'high' | 'medium' | 'low';
  maxDuration: number; // 1-10 minutes
  autoPlay: boolean;
  defaultPlaybackSpeed: number; // 0.5, 1, 1.5, 2
  saveLocally: boolean;
  enablePause: boolean;
  enablePlayback: boolean;
}

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  recordingQuality: 'medium',
  maxDuration: 10, // 10 minutes
  autoPlay: false,
  defaultPlaybackSpeed: 1,
  saveLocally: false,
  enablePause: true,
  enablePlayback: true,
};

/**
 * Save voice settings for a user
 */
export async function saveVoiceSettings(
  settings: Partial<VoiceSettings>
): Promise<{
  success: boolean;
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

    // Validate settings
    const validation = validateVoiceSettings(settings);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Get current user settings
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!currentUser) {
      return { success: false, error: 'User not found' };
    }

    // Merge with existing settings
    const currentSettings = currentUser.voiceSettings || {};
    const updatedSettings = { ...currentSettings, ...settings };

    // Update user record
    await db
      .update(users)
      .set({
        voiceSettings: updatedSettings,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return { success: true };
  } catch (error) {
    console.error('Error saving voice settings:', error);
    return { success: false, error: 'Failed to save voice settings' };
  }
}

/**
 * Get voice settings for a user
 */
export async function getVoiceSettings(): Promise<{
  success: boolean;
  settings?: VoiceSettings;
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

    // Get user settings
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!currentUser) {
      return { success: false, error: 'User not found' };
    }

    // Merge with defaults
    const settings = {
      ...DEFAULT_VOICE_SETTINGS,
      ...(currentUser.voiceSettings || {}),
    };

    return { success: true, settings };
  } catch (error) {
    console.error('Error getting voice settings:', error);
    return { success: false, error: 'Failed to get voice settings' };
  }
}

/**
 * Reset voice settings to defaults
 */
export async function resetVoiceSettings(): Promise<{
  success: boolean;
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

    // Update user record with default settings
    await db
      .update(users)
      .set({
        voiceSettings: DEFAULT_VOICE_SETTINGS,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return { success: true };
  } catch (error) {
    console.error('Error resetting voice settings:', error);
    return { success: false, error: 'Failed to reset voice settings' };
  }
}

/**
 * Validate voice settings
 */
function validateVoiceSettings(settings: Partial<VoiceSettings>): {
  isValid: boolean;
  error?: string;
} {
  // Validate recording quality
  if (
    settings.recordingQuality &&
    !['high', 'medium', 'low'].includes(settings.recordingQuality)
  ) {
    return {
      isValid: false,
      error: 'Recording quality must be high, medium, or low',
    };
  }

  // Validate max duration
  if (settings.maxDuration !== undefined) {
    if (settings.maxDuration < 1 || settings.maxDuration > 10) {
      return {
        isValid: false,
        error: 'Max duration must be between 1 and 10 minutes',
      };
    }
  }

  // Validate playback speed
  if (settings.defaultPlaybackSpeed !== undefined) {
    const validSpeeds = [0.5, 1, 1.5, 2];
    if (!validSpeeds.includes(settings.defaultPlaybackSpeed)) {
      return {
        isValid: false,
        error: 'Playback speed must be 0.5, 1, 1.5, or 2',
      };
    }
  }

  return { isValid: true };
}

/**
 * Get voice settings with browser recommendations
 */
export async function getVoiceSettingsWithRecommendations(): Promise<{
  success: boolean;
  settings?: VoiceSettings;
  recommendations?: {
    quality: 'high' | 'medium' | 'low';
    maxDuration: number;
    enablePause: boolean;
  };
  error?: string;
}> {
  try {
    const result = await getVoiceSettings();
    if (!result.success) {
      return result;
    }

    // Get browser recommendations (this would be done client-side)
    // For now, return default recommendations
    const recommendations = {
      quality: 'medium' as const,
      maxDuration: 10,
      enablePause: true,
    };

    return {
      success: true,
      settings: result.settings,
      recommendations,
    };
  } catch (error) {
    console.error('Error getting voice settings with recommendations:', error);
    return { success: false, error: 'Failed to get voice settings' };
  }
}

/**
 * Update specific voice setting
 */
export async function updateVoiceSetting<K extends keyof VoiceSettings>(
  key: K,
  value: VoiceSettings[K]
): Promise<{
  success: boolean;
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

    // Validate the specific setting
    const validation = validateVoiceSettings({
      [key]: value,
    } as Partial<VoiceSettings>);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Get current settings
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!currentUser) {
      return { success: false, error: 'User not found' };
    }

    // Update specific setting
    const currentSettings = currentUser.voiceSettings || {};
    const updatedSettings = { ...currentSettings, [key]: value };

    // Update user record
    await db
      .update(users)
      .set({
        voiceSettings: updatedSettings,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return { success: true };
  } catch (error) {
    console.error('Error updating voice setting:', error);
    return { success: false, error: 'Failed to update voice setting' };
  }
}

/**
 * Get voice settings for email composer
 */
export async function getVoiceSettingsForComposer(): Promise<{
  success: boolean;
  settings?: {
    maxDuration: number;
    quality: 'high' | 'medium' | 'low';
    enablePause: boolean;
    enablePlayback: boolean;
  };
  error?: string;
}> {
  try {
    const result = await getVoiceSettings();
    if (!result.success) {
      return result;
    }

    const settings = result.settings!;

    return {
      success: true,
      settings: {
        maxDuration: settings.maxDuration * 60, // Convert to seconds
        quality: settings.recordingQuality,
        enablePause: settings.enablePause,
        enablePlayback: settings.enablePlayback,
      },
    };
  } catch (error) {
    console.error('Error getting voice settings for composer:', error);
    return { success: false, error: 'Failed to get voice settings' };
  }
}
