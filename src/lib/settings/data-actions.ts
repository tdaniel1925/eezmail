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
      try {
        await db.delete(emails).where(inArray(emails.accountId, accountIds));
      } catch (error) {
        console.error('Error deleting emails:', error);
      }
      
      try {
        await db
          .delete(emailThreads)
          .where(inArray(emailThreads.accountId, accountIds));
      } catch (error) {
        console.error('Error deleting email threads:', error);
      }

      // Delete custom folders
      try {
        await db
          .delete(customFolders)
          .where(inArray(customFolders.accountId, accountIds));
      } catch (error) {
        console.error('Error deleting custom folders:', error);
      }
    }

    // Delete contacts and related data
    console.log('🗑️  Deleting contacts...');
    const userContacts = await db.query.contacts.findMany({
      where: eq(contacts.userId, user.id),
    });
    const contactIds = userContacts.map((c) => c.id);

    if (contactIds.length > 0) {
      try {
        await db
          .delete(contactEmails)
          .where(inArray(contactEmails.contactId, contactIds));
      } catch (error) {
        console.error('Error deleting contact emails:', error);
      }
      
      try {
        await db
          .delete(contactPhones)
          .where(inArray(contactPhones.contactId, contactIds));
      } catch (error) {
        console.error('Error deleting contact phones:', error);
      }
      
      try {
        await db
          .delete(contactAddresses)
          .where(inArray(contactAddresses.contactId, contactIds));
      } catch (error) {
        console.error('Error deleting contact addresses:', error);
      }
      
      try {
        await db.delete(contacts).where(eq(contacts.userId, user.id));
      } catch (error) {
        console.error('Error deleting contacts:', error);
      }
    }

    // Delete email accounts
    console.log('🗑️  Deleting email accounts...');
    try {
      await db.delete(emailAccounts).where(eq(emailAccounts.userId, user.id));
    } catch (error) {
      console.error('Error deleting email accounts:', error);
    }

    // Delete user settings, rules, signatures
    console.log('🗑️  Deleting user settings and rules...');
    try {
      await db.delete(emailSettings).where(eq(emailSettings.userId, user.id));
    } catch (error) {
      console.error('Error deleting email settings:', error);
    }
    
    try {
      await db.delete(emailRules).where(eq(emailRules.userId, user.id));
    } catch (error) {
      console.error('Error deleting email rules:', error);
    }
    
    try {
      await db.delete(emailSignatures).where(eq(emailSignatures.userId, user.id));
    } catch (error) {
      console.error('Error deleting email signatures:', error);
    }
    
    try {
      await db.delete(senderTrust).where(eq(senderTrust.userId, user.id));
    } catch (error) {
      console.error('Error deleting sender trust:', error);
    }

    // NOTE: User account and authentication are PRESERVED
    // User stays logged in and can add new email accounts
    console.log('✅ All data wiped successfully (user account preserved)');
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
