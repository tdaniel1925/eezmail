/**
 * Standalone script to delete email accounts with null refreshToken
 * Run with: node scripts/delete-account-standalone.mjs
 */

import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function deleteBrokenAccounts() {
  try {
    console.log('🔍 Looking for accounts with null refreshToken...');

    // Find accounts with null refreshToken
    const brokenAccounts = await sql`
      SELECT id, email_address, provider, refresh_token
      FROM email_accounts
      WHERE refresh_token IS NULL
    `;

    if (brokenAccounts.length === 0) {
      console.log('✅ No broken accounts found!');
      await sql.end();
      return;
    }

    console.log(
      `Found ${brokenAccounts.length} account(s) with null refreshToken:`
    );
    brokenAccounts.forEach((acc) => {
      console.log(`  - ${acc.email_address} (${acc.provider})`);
    });

    // Delete each broken account
    for (const account of brokenAccounts) {
      console.log(`\n🗑️  Deleting account: ${account.email_address}`);

      // Delete associated emails
      const deletedEmails =
        await sql`DELETE FROM emails WHERE account_id = ${account.id} RETURNING id`;
      console.log(`   Deleted ${deletedEmails.length} emails`);

      // Delete associated folders
      const deletedFolders =
        await sql`DELETE FROM email_folders WHERE account_id = ${account.id} RETURNING id`;
      console.log(`   Deleted ${deletedFolders.length} folders`);

      // Delete the account
      await sql`DELETE FROM email_accounts WHERE id = ${account.id}`;
      console.log(`   ✅ Account deleted`);
    }

    console.log('\n✨ All broken accounts have been cleaned up!');
    console.log(
      '\n📝 Next steps:'
    );
    console.log('   1. Refresh your browser (hard refresh: Ctrl+Shift+R)');
    console.log('   2. Go to Settings > Email Accounts');
    console.log('   3. Click "Add Account" and reconnect your Microsoft account');
    console.log('   4. The new connection will include a refresh token for automatic renewal');
    
    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

deleteBrokenAccounts();

