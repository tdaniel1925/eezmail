#!/usr/bin/env node

/**
 * List all email accounts from database
 * Run with: node list-email-accounts.js
 */

require('dotenv').config({ path: '.env.local' });

const postgres = require('postgres');

async function listAccounts() {
  const sql = postgres(process.env.DATABASE_URL, {
    ssl: 'require',
  });

  try {
    const accounts = await sql`
      SELECT 
        id, 
        email_address, 
        provider, 
        status, 
        sync_status,
        initial_sync_completed,
        last_sync_at
      FROM email_accounts
      ORDER BY created_at DESC
    `;

    console.log('\n📧 Email Accounts in Database:\n');
    console.log('='.repeat(80));

    if (accounts.length === 0) {
      console.log('No email accounts found.\n');
      console.log(
        'Connect an account at: http://localhost:3000/dashboard/settings\n'
      );
    } else {
      accounts.forEach((account, index) => {
        console.log(`\n${index + 1}. ${account.email_address}`);
        console.log(`   Account ID: ${account.id}`);
        console.log(`   Provider: ${account.provider}`);
        console.log(`   Status: ${account.status}`);
        console.log(`   Sync Status: ${account.sync_status || 'idle'}`);
        console.log(
          `   Initial Sync: ${account.initial_sync_completed ? 'Yes' : 'No'}`
        );
        console.log(`   Last Sync: ${account.last_sync_at || 'Never'}`);
      });

      console.log('\n' + '='.repeat(80));
      console.log(
        '\n💡 To trigger sync for an account, copy its Account ID and run:'
      );
      console.log('   node trigger-email-sync.js\n');
    }

    await sql.end();
  } catch (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  }
}

listAccounts();
