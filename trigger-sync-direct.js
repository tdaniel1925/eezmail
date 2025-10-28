#!/usr/bin/env node

/**
 * Direct sync trigger (bypasses API auth for testing)
 * Run with: node trigger-sync-direct.js <account-id>
 */

require('dotenv').config({ path: '.env.local' });

const postgres = require('postgres');

async function triggerSyncDirect(accountId) {
  const sql = postgres(process.env.DATABASE_URL, {
    ssl: 'require',
  });

  try {
    // 1. Get account info
    const [account] = await sql`
      SELECT id, user_id, email_address, provider, sync_status, initial_sync_completed
      FROM email_accounts
      WHERE id = ${accountId}
    `;

    if (!account) {
      console.error(`❌ Account not found: ${accountId}`);
      process.exit(1);
    }

    console.log('\n📧 Account Details:');
    console.log(`   Email: ${account.email_address}`);
    console.log(`   Provider: ${account.provider}`);
    console.log(`   Current Status: ${account.sync_status || 'idle'}`);
    console.log(
      `   Initial Sync: ${account.initial_sync_completed ? 'Yes' : 'No'}\n`
    );

    // 2. Check if already syncing
    if (account.sync_status === 'syncing') {
      console.log('⚠️  Account is already syncing!');
      await sql.end();
      process.exit(0);
    }

    // 3. Send event to Inngest
    console.log('🚀 Sending sync event to Inngest...\n');

    const inngestUrl =
      process.env.INNGEST_EVENT_URL ||
      'http://localhost:8288/e/imbox_email_client';

    const eventData = {
      name: 'sync/account',
      data: {
        accountId: account.id,
        userId: account.user_id,
        provider: account.provider,
        syncMode: account.initial_sync_completed ? 'incremental' : 'initial',
        trigger: 'manual',
        timestamp: Date.now(),
      },
    };

    console.log('Event data:', JSON.stringify(eventData, null, 2));
    console.log('');

    const response = await fetch(inngestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Inngest API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Sync event sent successfully!');
    console.log('   Event IDs:', result.ids);

    // 4. Update account status
    await sql`
      UPDATE email_accounts
      SET 
        sync_status = 'syncing',
        sync_progress = 0,
        updated_at = NOW()
      WHERE id = ${accountId}
    `;

    console.log('\n✅ Account status updated to "syncing"');
    console.log('\n🔍 Check Inngest dashboard: http://localhost:8288');
    console.log('   Look for "sync/account" events\n');

    await sql.end();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await sql.end();
    process.exit(1);
  }
}

// Get account ID from command line
const accountId = process.argv[2];

if (!accountId) {
  console.log('\n❌ Missing account ID\n');
  console.log('Usage: node trigger-sync-direct.js <account-id>\n');
  console.log('Run "node list-email-accounts.js" to see available accounts\n');
  process.exit(1);
}

console.log('\n🔄 Triggering Email Sync...\n');
triggerSyncDirect(accountId);
