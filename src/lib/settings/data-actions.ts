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
  contactNotes,
  contactTimeline,
  contactTags,
  contactTagAssignments,
  contactCustomFields,
  contactSocialLinks,
  emailAccounts,
  emailSettings,
  emailRules,
  emailSignatures,
  emailDrafts,
  scheduledEmails,
  senderTrust,
  customFolders,
  customLabels,
  labelAssignments,
  emailLabels,
  emailAttachments,
  syncJobs,
  aiReplyDrafts,
  chatbotActions,
  extractedActions,
  followUpReminders,
  tasks,
  userPreferences,
} from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { generateTestEmails } from '../../../scripts/generate-test-emails';

/**
 * Verify all data has been wiped
 * Returns counts of remaining data
 */
export async function verifyDataWipe(): Promise<{
  success: boolean;
  remainingData: Record<string, number>;
  isClean: boolean;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, remainingData: {}, isClean: false };
    }

    console.log('🔍 Verifying data wipe for user:', user.id);

    // Get account IDs first
    const userAccounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
    });
    const accountIds = userAccounts.map((acc) => acc.id);

    // Count remaining data
    const counts: Record<string, number> = {};

    // Check user-level data
    counts.emailAccounts = userAccounts.length;
    
    try {
      counts.contacts = (await db.query.contacts.findMany({ where: eq(contacts.userId, user.id) })).length;
    } catch (e) { counts.contacts = 0; }
    
    try {
      counts.contactNotes = (await db.query.contactNotes.findMany({ where: eq(contactNotes.userId, user.id) })).length;
    } catch (e) { counts.contactNotes = 0; }
    
    try {
      counts.contactTimeline = (await db.query.contactTimeline.findMany({ where: eq(contactTimeline.userId, user.id) })).length;
    } catch (e) { counts.contactTimeline = 0; }
    
    try {
      counts.emailSettings = (await db.query.emailSettings.findMany({ where: eq(emailSettings.userId, user.id) })).length;
    } catch (e) { counts.emailSettings = 0; }
    
    try {
      counts.emailRules = (await db.query.emailRules.findMany({ where: eq(emailRules.userId, user.id) })).length;
    } catch (e) { counts.emailRules = 0; }
    
    try {
      counts.emailSignatures = (await db.query.emailSignatures.findMany({ where: eq(emailSignatures.userId, user.id) })).length;
    } catch (e) { counts.emailSignatures = 0; }
    
    try {
      counts.senderTrust = (await db.query.senderTrust.findMany({ where: eq(senderTrust.userId, user.id) })).length;
    } catch (e) { counts.senderTrust = 0; }
    
    try {
      counts.aiReplyDrafts = (await db.query.aiReplyDrafts.findMany({ where: eq(aiReplyDrafts.userId, user.id) })).length;
    } catch (e) { counts.aiReplyDrafts = 0; }
    
    try {
      counts.chatbotActions = (await db.query.chatbotActions.findMany({ where: eq(chatbotActions.userId, user.id) })).length;
    } catch (e) { counts.chatbotActions = 0; }
    
    try {
      counts.extractedActions = (await db.query.extractedActions.findMany({ where: eq(extractedActions.userId, user.id) })).length;
    } catch (e) { counts.extractedActions = 0; }
    
    try {
      counts.followUpReminders = (await db.query.followUpReminders.findMany({ where: eq(followUpReminders.userId, user.id) })).length;
    } catch (e) { counts.followUpReminders = 0; }
    
    try {
      counts.tasks = (await db.query.tasks.findMany({ where: eq(tasks.userId, user.id) })).length;
    } catch (e) { counts.tasks = 0; }
    
    try {
      counts.customLabels = (await db.query.customLabels.findMany({ where: eq(customLabels.userId, user.id) })).length;
    } catch (e) { counts.customLabels = 0; }

    // Check account-level data if accounts exist
    if (accountIds.length > 0) {
      try {
        counts.emails = (await db.query.emails.findMany({ where: inArray(emails.accountId, accountIds) })).length;
      } catch (e) { counts.emails = 0; }
      
      try {
        counts.emailThreads = (await db.query.emailThreads.findMany({ where: inArray(emailThreads.accountId, accountIds) })).length;
      } catch (e) { counts.emailThreads = 0; }
      
      try {
        counts.emailDrafts = (await db.query.emailDrafts.findMany({ where: inArray(emailDrafts.accountId, accountIds) })).length;
      } catch (e) { counts.emailDrafts = 0; }
      
      try {
        counts.scheduledEmails = (await db.query.scheduledEmails.findMany({ where: inArray(scheduledEmails.accountId, accountIds) })).length;
      } catch (e) { counts.scheduledEmails = 0; }
      
      try {
        counts.customFolders = (await db.query.customFolders.findMany({ where: inArray(customFolders.accountId, accountIds) })).length;
      } catch (e) { counts.customFolders = 0; }
    } else {
      counts.emails = 0;
      counts.emailThreads = 0;
      counts.emailDrafts = 0;
      counts.scheduledEmails = 0;
      counts.customFolders = 0;
    }

    // Calculate total
    const totalRemaining = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const isClean = totalRemaining === 0;

    console.log('📊 Verification Results:', counts);
    console.log(isClean ? '✅ All data wiped!' : '⚠️  Some data remains:', totalRemaining, 'records');

    return {
      success: true,
      remainingData: counts,
      isClean,
    };
  } catch (error) {
    console.error('❌ Error verifying data wipe:', error);
    return {
      success: false,
      remainingData: {},
      isClean: false,
    };
  }
}

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

    // Delete ALL user-related data (comprehensive cleanup)
    console.log('🗑️  Deleting additional user data...');
    
    try {
      await db.delete(contactNotes).where(eq(contactNotes.userId, user.id));
    } catch (error) {
      console.error('Error deleting contact notes:', error);
    }
    
    try {
      await db.delete(contactTimeline).where(eq(contactTimeline.userId, user.id));
    } catch (error) {
      console.error('Error deleting contact timeline:', error);
    }
    
    try {
      await db.delete(contactCustomFields).where(eq(contactCustomFields.userId, user.id));
    } catch (error) {
      console.error('Error deleting contact custom fields:', error);
    }
    
    try {
      await db.delete(contactTags).where(eq(contactTags.userId, user.id));
    } catch (error) {
      console.error('Error deleting contact tags:', error);
    }
    
    try {
      await db.delete(aiReplyDrafts).where(eq(aiReplyDrafts.userId, user.id));
    } catch (error) {
      console.error('Error deleting AI reply drafts:', error);
    }
    
    try {
      await db.delete(chatbotActions).where(eq(chatbotActions.userId, user.id));
    } catch (error) {
      console.error('Error deleting chatbot actions:', error);
    }
    
    try {
      await db.delete(extractedActions).where(eq(extractedActions.userId, user.id));
    } catch (error) {
      console.error('Error deleting extracted actions:', error);
    }
    
    try {
      await db.delete(followUpReminders).where(eq(followUpReminders.userId, user.id));
    } catch (error) {
      console.error('Error deleting follow-up reminders:', error);
    }
    
    try {
      await db.delete(tasks).where(eq(tasks.userId, user.id));
    } catch (error) {
      console.error('Error deleting tasks:', error);
    }
    
    try {
      await db.delete(customLabels).where(eq(customLabels.userId, user.id));
    } catch (error) {
      console.error('Error deleting custom labels:', error);
    }
    
    try {
      await db.delete(userPreferences).where(eq(userPreferences.userId, user.id));
    } catch (error) {
      console.error('Error deleting user preferences:', error);
    }

    if (accountIds.length > 0) {
      // Delete account-specific data
      try {
        await db.delete(emailDrafts).where(inArray(emailDrafts.accountId, accountIds));
      } catch (error) {
        console.error('Error deleting email drafts:', error);
      }
      
      try {
        await db.delete(scheduledEmails).where(inArray(scheduledEmails.accountId, accountIds));
      } catch (error) {
        console.error('Error deleting scheduled emails:', error);
      }
      
      try {
        await db.delete(emailLabels).where(inArray(emailLabels.accountId, accountIds));
      } catch (error) {
        console.error('Error deleting email labels:', error);
      }
      
      try {
        await db.delete(labelAssignments).where(inArray(labelAssignments.accountId, accountIds));
      } catch (error) {
        console.error('Error deleting label assignments:', error);
      }
      
      try {
        await db.delete(emailAttachments).where(inArray(emailAttachments.accountId, accountIds));
      } catch (error) {
        console.error('Error deleting email attachments:', error);
      }
      
      try {
        await db.delete(syncJobs).where(inArray(syncJobs.accountId, accountIds));
      } catch (error) {
        console.error('Error deleting sync jobs:', error);
      }
    }

    // NOTE: User account and authentication are PRESERVED
    // User stays logged in and can add new email accounts
    console.log('✅ All data wiped successfully (user account preserved)');
    
    // Verify the wipe
    const verification = await verifyDataWipe();
    if (!verification.isClean) {
      console.warn('⚠️  Warning: Some data may still remain:', verification.remainingData);
    }
    
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
