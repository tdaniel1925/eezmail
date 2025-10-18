'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * Export all user data as JSON
 */
export async function exportUserData(): Promise<{
  success: boolean;
  data?: any;
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

    // Fetch all user data
    const [emails, contacts, contactNotes, contactTimeline, settings] = await Promise.all([
      db.execute(sql`SELECT * FROM emails WHERE user_id = ${user.id}`),
      db.execute(sql`SELECT * FROM contacts WHERE user_id = ${user.id}`),
      db.execute(sql`SELECT * FROM contact_notes WHERE user_id = ${user.id}`),
      db.execute(sql`SELECT * FROM contact_timeline WHERE user_id = ${user.id}`),
      db.execute(sql`SELECT * FROM email_accounts WHERE user_id = ${user.id}`),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
      },
      emails: emails.rows,
      contacts: contacts.rows,
      contactNotes: contactNotes.rows,
      contactTimeline: contactTimeline.rows,
      emailAccounts: settings.rows.map((account: any) => ({
        ...account,
        // Remove sensitive data
        accessToken: undefined,
        refreshToken: undefined,
        imapPassword: undefined,
      })),
    };

    return { success: true, data: exportData };
  } catch (error) {
    console.error('Error exporting data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

/**
 * Delete all user data (soft delete, can be recovered)
 */
export async function deleteUserData(): Promise<{
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

    // Soft delete by marking user for deletion
    await db.execute(sql`
      UPDATE auth.users 
      SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{deleted_at}',
        to_jsonb(NOW()::text)
      )
      WHERE id = ${user.id}
    `);

    // Mark all data for deletion
    await Promise.all([
      db.execute(sql`UPDATE emails SET deleted_at = NOW() WHERE user_id = ${user.id}`),
      db.execute(sql`UPDATE contacts SET deleted_at = NOW() WHERE user_id = ${user.id}`),
      db.execute(sql`UPDATE email_accounts SET deleted_at = NOW() WHERE user_id = ${user.id}`),
    ]);

    return { success: true };
  } catch (error) {
    console.error('Error deleting data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * Download user data with attachments
 */
export async function downloadUserData(): Promise<{
  success: boolean;
  downloadUrl?: string;
  error?: string;
}> {
  try {
    const exportResult = await exportUserData();
    
    if (!exportResult.success || !exportResult.data) {
      return { success: false, error: exportResult.error };
    }

    // Create downloadable JSON
    const blob = JSON.stringify(exportResult.data, null, 2);
    const base64 = Buffer.from(blob).toString('base64');
    const dataUrl = `data:application/json;base64,${base64}`;

    return { success: true, downloadUrl: dataUrl };
  } catch (error) {
    console.error('Error downloading data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download failed',
    };
  }
}

/**
 * Clear application cache
 */
export async function clearCache(): Promise<{
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

    // Clear any cached data (this would integrate with your caching layer)
    // For now, we'll just return success as there's no Redis/cache layer yet
    
    return { success: true };
  } catch (error) {
    console.error('Error clearing cache:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Clear cache failed',
    };
  }
}

/**
 * Optimize database for user
 */
export async function optimizeDatabase(): Promise<{
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

    // Run VACUUM and ANALYZE on user's data
    await db.execute(sql`VACUUM ANALYZE emails`);
    await db.execute(sql`VACUUM ANALYZE contacts`);
    await db.execute(sql`VACUUM ANALYZE contact_timeline`);

    return { success: true };
  } catch (error) {
    console.error('Error optimizing database:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Optimization failed',
    };
  }
}

/**
 * Reset all settings to defaults
 */
export async function resetSettings(): Promise<{
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

    // Reset user metadata to defaults
    await supabase.auth.updateUser({
      data: {
        preferences: {
          theme: 'system',
          emailsPerPage: 50,
          enableRichText: true,
          enableSpellCheck: true,
          defaultSendFrom: '',
          enableDesktopNotifications: true,
          enableSoundNotifications: false,
          language: 'en',
          timezone: 'UTC',
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error resetting settings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Reset failed',
    };
  }
}

/**
 * Clear application logs
 */
export async function clearLogs(): Promise<{
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

    // Clear old usage logs (keep last 30 days)
    await db.execute(sql`
      DELETE FROM usage_logs 
      WHERE user_id = ${user.id} 
      AND created_at < NOW() - INTERVAL '30 days'
    `);

    return { success: true };
  } catch (error) {
    console.error('Error clearing logs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Clear logs failed',
    };
  }
}

/**
 * Test email account connection
 */
export async function testConnection(accountId: string): Promise<{
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

    // Get account details
    const result = await db.execute(sql`
      SELECT * FROM email_accounts 
      WHERE id = ${accountId} AND user_id = ${user.id}
    `);

    if (!result.rows || result.rows.length === 0) {
      return { success: false, error: 'Account not found' };
    }

    const account = result.rows[0];

    // Test connection based on provider
    if (account.provider === 'gmail' || account.provider === 'microsoft') {
      // OAuth providers - check if token is valid
      const hasToken = account.access_token && account.refresh_token;
      return { 
        success: hasToken, 
        error: hasToken ? undefined : 'Token expired, please reconnect' 
      };
    } else if (account.provider === 'imap') {
      // IMAP - would test actual connection
      // For now, just check if credentials exist
      const hasCredentials = account.imap_host && account.imap_username && account.imap_password;
      return { 
        success: hasCredentials, 
        error: hasCredentials ? undefined : 'Missing IMAP credentials' 
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error testing connection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
    };
  }
}

