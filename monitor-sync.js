#!/usr/bin/env node

/**
 * Real-time Email Sync Monitor
 * Run with: node monitor-sync.js <account-id>
 */

require('dotenv').config({ path: '.env.local' });

const postgres = require('postgres');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
});

let lastEmailCount = 0;
let lastProgress = 0;
let startTime = Date.now();
let checkCount = 0;

async function getAccountStatus(accountId) {
  const [account] = await sql`
    SELECT 
      id, 
      email_address, 
      provider, 
      sync_status,
      sync_progress,
      sync_total,
      initial_sync_completed,
      last_sync_at,
      last_sync_error
    FROM email_accounts
    WHERE id = ${accountId}
  `;

  if (!account) {
    return null;
  }

  // Get email count
  const [{ count }] = await sql`
    SELECT COUNT(*) as count
    FROM emails
    WHERE account_id = ${accountId}
  `;

  return {
    ...account,
    emailCount: parseInt(count),
  };
}

async function monitorSync(accountId) {
  try {
    checkCount++;
    const status = await getAccountStatus(accountId);

    if (!status) {
      console.log(
        `${colors.red}❌ Account not found: ${accountId}${colors.reset}`
      );
      process.exit(1);
    }

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const newEmails = status.emailCount - lastEmailCount;

    // Clear screen (optional - comment out if you want to see history)
    // process.stdout.write('\x1Bc');

    console.log(`\n${'='.repeat(80)}`);
    console.log(
      `${colors.bright}📊 Email Sync Monitor${colors.reset} - ${new Date().toLocaleTimeString()}`
    );
    console.log(`${'='.repeat(80)}\n`);

    console.log(
      `${colors.cyan}Account:${colors.reset} ${status.email_address}`
    );
    console.log(`${colors.cyan}Provider:${colors.reset} ${status.provider}`);
    console.log(
      `${colors.cyan}Elapsed Time:${colors.reset} ${elapsed}s (Check #${checkCount})\n`
    );

    // Status indicator
    let statusEmoji = '⏸️ ';
    let statusColor = colors.yellow;
    let statusText = status.sync_status || 'idle';

    if (status.sync_status === 'syncing') {
      statusEmoji = '🔄';
      statusColor = colors.blue;
    } else if (status.sync_status === 'idle' && status.emailCount > 0) {
      statusEmoji = '✅';
      statusColor = colors.green;
      statusText = 'completed';
    } else if (status.last_sync_error) {
      statusEmoji = '❌';
      statusColor = colors.red;
      statusText = 'error';
    }

    console.log(
      `${statusColor}${statusEmoji} Status: ${statusText.toUpperCase()}${colors.reset}`
    );

    // Progress bar
    if (status.sync_total > 0) {
      const progress = Math.min(
        100,
        Math.floor((status.sync_progress / status.sync_total) * 100)
      );
      const barLength = 50;
      const filled = Math.floor((progress / 100) * barLength);
      const empty = barLength - filled;
      const bar = '█'.repeat(filled) + '░'.repeat(empty);

      console.log(
        `\n${colors.cyan}Progress:${colors.reset} [${bar}] ${progress}%`
      );
      console.log(
        `${colors.cyan}Synced:${colors.reset} ${status.sync_progress} / ${status.sync_total} emails`
      );
    }

    // Email count
    console.log(
      `\n${colors.green}📧 Total Emails Synced: ${status.emailCount}${colors.reset}`
    );

    if (newEmails > 0) {
      console.log(
        `${colors.green}   +${newEmails} new emails since last check${colors.reset}`
      );
    }

    // Sync type
    const syncType = status.initial_sync_completed ? 'Incremental' : 'Initial';
    console.log(`${colors.cyan}Sync Type:${colors.reset} ${syncType}`);

    // Last sync time
    if (status.last_sync_at) {
      const lastSync = new Date(status.last_sync_at);
      console.log(
        `${colors.cyan}Last Sync:${colors.reset} ${lastSync.toLocaleString()}`
      );
    }

    // Error display
    if (status.last_sync_error) {
      console.log(
        `\n${colors.red}❌ Error: ${status.last_sync_error}${colors.reset}`
      );
    }

    console.log(`\n${'='.repeat(80)}`);

    // Update counters
    lastEmailCount = status.emailCount;
    lastProgress = status.sync_progress;

    // Check if sync is complete
    if (status.sync_status !== 'syncing') {
      if (status.emailCount > 0) {
        console.log(
          `\n${colors.green}✅ Sync completed successfully!${colors.reset}`
        );
        console.log(`\n📊 Final Stats:`);
        console.log(`   - Total Emails: ${status.emailCount}`);
        console.log(`   - Time Taken: ${elapsed}s`);
        console.log(
          `   - Average Speed: ${(status.emailCount / elapsed).toFixed(2)} emails/sec`
        );
        console.log(
          `\n🎉 You can now view your emails at: http://localhost:3000/dashboard/inbox\n`
        );
      } else if (status.last_sync_error) {
        console.log(
          `\n${colors.red}❌ Sync failed. Check the error above.${colors.reset}`
        );
        console.log(`\n💡 Try:`);
        console.log(`   1. Check Inngest dashboard: http://localhost:8288`);
        console.log(`   2. Verify your OAuth tokens are valid`);
        console.log(`   3. Re-run: node trigger-sync-direct.js ${accountId}\n`);
      } else {
        console.log(
          `\n⏸️  Sync is idle. Run trigger-sync-direct.js to start syncing.\n`
        );
      }

      await sql.end();
      process.exit(0);
    }

    // Continue monitoring
    console.log(
      `${colors.yellow}⏳ Checking again in 3 seconds... (Press Ctrl+C to stop)${colors.reset}\n`
    );
    setTimeout(() => monitorSync(accountId), 3000);
  } catch (error) {
    console.error(
      `\n${colors.red}❌ Monitor Error: ${error.message}${colors.reset}`
    );
    await sql.end();
    process.exit(1);
  }
}

// Get account ID from command line
const accountId = process.argv[2];

if (!accountId) {
  console.log('\n❌ Missing account ID\n');
  console.log('Usage: node monitor-sync.js <account-id>\n');
  console.log('Run "node list-email-accounts.js" to see available accounts\n');
  process.exit(1);
}

console.log(`\n${colors.bright}🚀 Starting Sync Monitor...${colors.reset}\n`);
console.log(`${colors.cyan}Account ID:${colors.reset} ${accountId}`);
console.log(`${colors.cyan}Refresh Rate:${colors.reset} Every 3 seconds`);
console.log(`${colors.yellow}Press Ctrl+C to stop monitoring${colors.reset}\n`);

// Start monitoring
monitorSync(accountId);

// Handle Ctrl+C gracefully
process.on('SIGINT', async () => {
  console.log(
    `\n\n${colors.yellow}⏸️  Monitor stopped by user${colors.reset}\n`
  );
  await sql.end();
  process.exit(0);
});
