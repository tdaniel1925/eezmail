/**
 * Force delete the specific broken account
 * Run with: node scripts/force-delete-account.mjs
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

async function forceDeleteAccount() {
  try {
    const accountId = '6193fdac-9c5a-4975-99d6-913a2a843d05'; // From the logs
    
    console.log(`🗑️  Force deleting account: ${accountId}`);

    // Delete associated emails
    const deletedEmails =
      await sql`DELETE FROM emails WHERE account_id = ${accountId} RETURNING id`;
    console.log(`   Deleted ${deletedEmails.length} emails`);

    // Delete associated folders
    const deletedFolders =
      await sql`DELETE FROM email_folders WHERE account_id = ${accountId} RETURNING id`;
    console.log(`   Deleted ${deletedFolders.length} folders`);

    // Delete the account
    const deletedAccount = await sql`DELETE FROM email_accounts WHERE id = ${accountId} RETURNING email_address`;
    
    if (deletedAccount.length > 0) {
      console.log(`   ✅ Account deleted: ${deletedAccount[0].email_address}`);
    } else {
      console.log('   ⚠️  Account not found (may already be deleted)');
    }

    console.log('\n✨ Account cleanup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Refresh your browser (hard refresh: Ctrl+Shift+R)');
    console.log('   2. Go to Settings > Email Accounts');
    console.log('   3. Click "Add Account" and reconnect your Microsoft account');
    console.log('   4. The new connection will include offline_access scope for refresh tokens');
    
    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

forceDeleteAccount();

