/**
 * Quick script to delete the email account with null refreshToken
 * Run with: npx tsx scripts/delete-broken-account.ts
 */

import { db } from '@/lib/db';
import { emailAccounts, emails, emailFolders } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function deleteBrokenAccount() {
  try {
    console.log('🔍 Looking for accounts with null refreshToken...');

    // Find accounts with null refreshToken
    const brokenAccounts = await db.query.emailAccounts.findMany({
      where: (accounts, { isNull }) => isNull(accounts.refreshToken),
    });

    if (brokenAccounts.length === 0) {
      console.log('✅ No broken accounts found!');
      return;
    }

    console.log(
      `Found ${brokenAccounts.length} account(s) with null refreshToken:`
    );
    brokenAccounts.forEach((acc) => {
      console.log(`  - ${acc.emailAddress} (${acc.provider})`);
    });

    // Delete each broken account
    for (const account of brokenAccounts) {
      console.log(`\n🗑️  Deleting account: ${account.emailAddress}`);

      // Delete associated emails
      const deletedEmails = await db
        .delete(emails)
        .where(eq(emails.accountId, account.id))
        .returning();
      console.log(`   Deleted ${deletedEmails.length} emails`);

      // Delete associated folders
      const deletedFolders = await db
        .delete(emailFolders)
        .where(eq(emailFolders.accountId, account.id))
        .returning();
      console.log(`   Deleted ${deletedFolders.length} folders`);

      // Delete the account
      await db.delete(emailAccounts).where(eq(emailAccounts.id, account.id));
      console.log(`   ✅ Account deleted`);
    }

    console.log('\n✨ All broken accounts have been cleaned up!');
    console.log(
      '\n📝 Next step: Reconnect your Microsoft account in Settings > Email Accounts'
    );
    console.log(
      '   The new connection will include a refresh token for automatic token renewal.'
    );
  } catch (error) {
    console.error('❌ Error deleting broken accounts:', error);
    process.exit(1);
  }
}

deleteBrokenAccount()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

