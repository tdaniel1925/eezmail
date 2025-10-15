/**
 * Check all email accounts in database
 * Run with: node scripts/check-accounts.mjs
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

async function checkAccounts() {
  try {
    console.log('🔍 Checking all email accounts...\n');

    const accounts = await sql`
      SELECT 
        id, 
        email_address, 
        provider, 
        status,
        CASE 
          WHEN refresh_token IS NULL THEN 'NULL'
          ELSE 'EXISTS'
        END as refresh_token_status,
        token_expires_at,
        last_sync_at,
        last_sync_error,
        created_at
      FROM email_accounts
      ORDER BY created_at DESC
    `;

    if (accounts.length === 0) {
      console.log('📭 No email accounts found in database');
    } else {
      console.log(`Found ${accounts.length} email account(s):\n`);
      accounts.forEach((acc, idx) => {
        console.log(`Account ${idx + 1}:`);
        console.log(`  Email: ${acc.email_address}`);
        console.log(`  Provider: ${acc.provider}`);
        console.log(`  Status: ${acc.status}`);
        console.log(`  Refresh Token: ${acc.refresh_token_status}`);
        console.log(`  Token Expires: ${acc.token_expires_at}`);
        console.log(`  Last Sync: ${acc.last_sync_at || 'Never'}`);
        console.log(`  Last Error: ${acc.last_sync_error || 'None'}`);
        console.log(`  Created: ${acc.created_at}`);
        console.log('');
      });
    }

    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

checkAccounts();

