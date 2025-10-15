'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import {
  emails,
  emailThreads,
  contacts,
  contactEmails,
  contactPhones,
  contactAddresses,
  emailAccounts,
  emailSettings,
  emailRules,
  emailSignatures,
  senderTrust,
  customFolders,
} from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { generateTestEmails } from '../../../scripts/generate-test-emails';

/**
 * Wipe all user data from the system
 * WARNING: This is irreversible!
 */
export async function wipeAllUserData(): Promise<{
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

    console.log('🚨 Starting complete data wipe for user:', user.id);

    // Get all user's email accounts
    const userAccounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
    });

    const accountIds = userAccounts.map((acc) => acc.id);

    if (accountIds.length > 0) {
      // Delete emails and threads (cascade will handle many relations)
      console.log('🗑️  Deleting emails and threads...');
      await db.delete(emails).where(inArray(emails.accountId, accountIds));
      await db
        .delete(emailThreads)
        .where(inArray(emailThreads.accountId, accountIds));

      // Delete custom folders
      await db
        .delete(customFolders)
        .where(inArray(customFolders.accountId, accountIds));
    }

    // Delete contacts and related data
    console.log('🗑️  Deleting contacts...');
    const userContacts = await db.query.contacts.findMany({
      where: eq(contacts.userId, user.id),
    });
    const contactIds = userContacts.map((c) => c.id);

    if (contactIds.length > 0) {
      await db
        .delete(contactEmails)
        .where(inArray(contactEmails.contactId, contactIds));
      await db
        .delete(contactPhones)
        .where(inArray(contactPhones.contactId, contactIds));
      await db
        .delete(contactAddresses)
        .where(inArray(contactAddresses.contactId, contactIds));
      await db.delete(contacts).where(eq(contacts.userId, user.id));
    }

    // Delete email accounts
    console.log('🗑️  Deleting email accounts...');
    await db.delete(emailAccounts).where(eq(emailAccounts.userId, user.id));

    // Delete user settings, rules, signatures
    console.log('🗑️  Deleting user settings and rules...');
    await db.delete(emailSettings).where(eq(emailSettings.userId, user.id));
    await db.delete(emailRules).where(eq(emailRules.userId, user.id));
    await db.delete(emailSignatures).where(eq(emailSignatures.userId, user.id));
    await db.delete(senderTrust).where(eq(senderTrust.userId, user.id));

    // Delete user from Supabase auth
    console.log('🗑️  Deleting user account...');
    const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

    if (authError) {
      console.error('Error deleting user from auth:', authError);
      // Continue anyway - data is already deleted
    }

    console.log('✅ Complete data wipe successful');
    return { success: true };
  } catch (error) {
    console.error('❌ Error wiping user data:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to wipe user data',
    };
  }
}

/**
 * Generate test emails for development and testing
 */
export async function generateTestEmailData(): Promise<{
  success: boolean;
  count?: number;
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

    // Get user's first email account
    const account = await db.query.emailAccounts.findFirst({
      where: eq(emailAccounts.userId, user.id),
    });

    if (!account) {
      return {
        success: false,
        error: 'No email account found. Please connect an account first.',
      };
    }

    console.log('🌱 Generating test emails for account:', account.emailAddress);
    const result = await generateTestEmails(user.id, account.id);

    return { success: true, count: result.count };
  } catch (error) {
    console.error('❌ Error generating test emails:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to generate test emails',
    };
  }
}
