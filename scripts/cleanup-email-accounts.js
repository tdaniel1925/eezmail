#!/usr/bin/env node

/**
 * Cleanup Email Accounts Script
 * Removes all email accounts from database to fix immediate errors
 */

require('dotenv').config({ path: '.env.local' });

const { db } = require('../src/lib/db');
const { emailAccounts } = require('../src/db/schema');
const { createClient } = require('../src/lib/supabase/server');

async function cleanupEmailAccounts() {
  try {
    console.log('\n🧹 Cleaning up email accounts...\n');

    // Get current user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('❌ Not authenticated');
      return;
    }

    console.log(`👤 User: ${user.email || user.id}`);

    // Get all email accounts for this user
    const accounts = await db.query.emailAccounts.findMany({
      where: (accounts, { eq }) => eq(accounts.userId, user.id),
    });

    console.log(`📧 Found ${accounts.length} email account(s)`);

    if (accounts.length === 0) {
      console.log('✅ No accounts to clean up');
      return;
    }

    // Show accounts that will be deleted
    accounts.forEach((account, index) => {
      console.log(
        `   ${index + 1}. ${account.emailAddress || 'Unknown'} (${account.provider}) - Status: ${account.status}`
      );
      if (account.lastSyncError) {
        console.log(`      Error: ${account.lastSyncError}`);
      }
    });

    // Delete all email accounts
    const { deletedCount } = await db
      .delete(emailAccounts)
      .where(eq(emailAccounts.userId, user.id));

    console.log(
      `\n✅ Deleted ${deletedCount || accounts.length} email account(s)`
    );
    console.log('🎉 Database cleaned up successfully!');
    console.log('\n📝 Next steps:');
    console.log(
      '   1. Try clicking the Email Accounts tab - no more immediate errors'
    );
    console.log('   2. Click "Add Account" to connect Microsoft');
    console.log('   3. The connection should work now!\n');
  } catch (error) {
    console.error('❌ Error cleaning up email accounts:', error.message);
    process.exit(1);
  }
}

cleanupEmailAccounts();
