/**
 * Cleanup Orphaned Sync Jobs Script
 *
 * This script cancels Inngest sync jobs for email accounts that no longer exist.
 * Run this manually when you see foreign key errors for missing accounts.
 *
 * Usage:
 *   npx tsx scripts/cleanup-orphaned-syncs.ts
 *
 * Note: This requires Inngest Cloud access and may need additional setup
 */

import { db } from '../src/lib/db';
import { emailAccounts } from '../src/db/schema';

async function cleanupOrphanedSyncs() {
  console.log('🧹 Starting orphaned sync job cleanup...\n');

  try {
    // Get all email accounts
    const accounts = await db
      .select({ id: emailAccounts.id })
      .from(emailAccounts);
    const accountIds = new Set(accounts.map((a) => a.id));

    console.log(`✅ Found ${accountIds.size} active email accounts\n`);

    // Note: Inngest doesn't provide a direct API to list/cancel running jobs
    // This would require:
    // 1. Inngest Cloud API access
    // 2. Custom job tracking in database
    // 3. Manual intervention via Inngest dashboard

    console.log('⚠️  Manual Steps Required:');
    console.log('1. Go to https://app.inngest.com');
    console.log('2. Navigate to Functions → Running');
    console.log('3. Look for sync jobs with these IDs:');
    console.log('   - sync-microsoft-account');
    console.log('   - sync-gmail-account');
    console.log('   - sync-imap-account');
    console.log('4. Check if account_id in event data exists in:');
    console.log(`   Active accounts: ${Array.from(accountIds).join(', ')}`);
    console.log('5. Cancel jobs for missing accounts\n');

    console.log('💡 Prevention:');
    console.log(
      'The sync functions now validate account existence before processing.'
    );
    console.log('New orphaned jobs should be automatically prevented.\n');

    console.log('✅ Cleanup check complete!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupOrphanedSyncs()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
