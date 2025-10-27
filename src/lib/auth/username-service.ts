'use server';

import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

// Username validation regex: 3-20 characters, lowercase letters, numbers, and underscore
const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

/**
 * Check if a username is available
 */
export async function isUsernameAvailable(
  username: string
): Promise<{ available: boolean; error?: string }> {
  try {
    // Validate format
    if (!USERNAME_REGEX.test(username)) {
      return {
        available: false,
        error:
          'Username must be 3-20 characters and contain only lowercase letters, numbers, and underscores',
      };
    }

    // Check if username exists in database
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, username),
      columns: {
        id: true,
      },
    });

    return {
      available: !existingUser,
      error: existingUser ? 'Username is already taken' : undefined,
    };
  } catch (error) {
    console.error('Error checking username availability:', error);
    return {
      available: false,
      error: 'Failed to check username availability',
    };
  }
}

/**
 * Generate a unique username
 * If preferredUsername is provided and available, use it
 * Otherwise, append a random 4-digit suffix
 */
export async function generateUsername(
  preferredUsername?: string,
  userId?: string
): Promise<{ username: string; error?: string }> {
  try {
    let baseUsername = preferredUsername;

    // If no preferred username, generate one from user email
    if (!baseUsername && userId) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          email: true,
        },
      });

      if (user?.email) {
        baseUsername = user.email.split('@')[0];
      } else {
        baseUsername = 'user';
      }
    }

    if (!baseUsername) {
      baseUsername = 'user';
    }

    // Sanitize username
    baseUsername = sanitizeUsername(baseUsername);

    // Check if base username is available
    const checkResult = await isUsernameAvailable(baseUsername);
    if (checkResult.available) {
      return { username: baseUsername };
    }

    // Try appending random 4-digit numbers (max 5 attempts)
    for (let i = 0; i < 5; i++) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit number
      const candidateUsername = `${baseUsername}_${randomSuffix}`;

      const checkResult = await isUsernameAvailable(candidateUsername);
      if (checkResult.available) {
        return { username: candidateUsername };
      }
    }

    // If all attempts failed, use timestamp
    const timestamp = Date.now().toString().slice(-6);
    const finalUsername = `${baseUsername}_${timestamp}`;

    return { username: finalUsername };
  } catch (error) {
    console.error('Error generating username:', error);
    return {
      username: `user_${Date.now()}`,
      error: 'Failed to generate username',
    };
  }
}

/**
 * Sanitize a username by removing invalid characters
 */
function sanitizeUsername(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_') // Replace invalid chars with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .substring(0, 20); // Limit to 20 characters
}

/**
 * Update a user's username
 * Validates format and availability before updating
 */
export async function updateUsername(
  userId: string,
  newUsername: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate format
    if (!USERNAME_REGEX.test(newUsername)) {
      return {
        success: false,
        error:
          'Username must be 3-20 characters and contain only lowercase letters, numbers, and underscores',
      };
    }

    // Check if username is available (excluding current user)
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, newUsername),
      columns: {
        id: true,
      },
    });

    if (existingUser && existingUser.id !== userId) {
      return {
        success: false,
        error: 'Username is already taken',
      };
    }

    // Update username in database
    await db
      .update(users)
      .set({ username: newUsername })
      .where(eq(users.id, userId));

    // Update Supabase Auth user metadata (optional, for consistency)
    try {
      const supabase = await createClient();
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { username: newUsername },
      });
    } catch (authError) {
      console.warn('Failed to update Supabase Auth metadata:', authError);
      // Continue anyway since database update succeeded
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating username:', error);
    return {
      success: false,
      error: 'Failed to update username',
    };
  }
}

/**
 * Validate username format
 */
export function validateUsernameFormat(username: string): {
  valid: boolean;
  error?: string;
} {
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }

  if (username.length > 20) {
    return { valid: false, error: 'Username must be at most 20 characters' };
  }

  if (!USERNAME_REGEX.test(username)) {
    return {
      valid: false,
      error:
        'Username can only contain lowercase letters, numbers, and underscores',
    };
  }

  return { valid: true };
}
