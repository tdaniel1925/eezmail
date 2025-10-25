/**
 * Check if required tables exist in the database
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const sql = postgres(process.env.DATABASE_URL);

async function checkTables() {
  try {
    console.log('🔍 Checking required tables...\n');

    // Check scheduled_emails table
    const scheduledEmailsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'scheduled_emails'
      );
    `;
    console.log(
      `scheduled_emails table: ${scheduledEmailsExists[0].exists ? '✅ EXISTS' : '❌ MISSING'}`
    );

    // Check proactive_alerts table
    const proactiveAlertsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'proactive_alerts'
      );
    `;
    console.log(
      `proactive_alerts table: ${proactiveAlertsExists[0].exists ? '✅ EXISTS' : '❌ MISSING'}`
    );

    // Check proactive_alert_type enum
    const proactiveAlertTypeExists = await sql`
      SELECT EXISTS (
        SELECT FROM pg_type 
        WHERE typname = 'proactive_alert_type'
      );
    `;
    console.log(
      `proactive_alert_type enum: ${proactiveAlertTypeExists[0].exists ? '✅ EXISTS' : '❌ MISSING'}`
    );

    console.log('\n');

    // If any are missing, show instructions
    if (
      !scheduledEmailsExists[0].exists ||
      !proactiveAlertsExists[0].exists ||
      !proactiveAlertTypeExists[0].exists
    ) {
      console.log('⚠️  MISSING TABLES DETECTED\n');
      console.log('To fix, run these migrations:');

      if (!scheduledEmailsExists[0].exists) {
        console.log('  node scripts/run-migration.js 005');
      }

      if (
        !proactiveAlertsExists[0].exists ||
        !proactiveAlertTypeExists[0].exists
      ) {
        console.log('  node scripts/run-migration.js 006');
      }
    } else {
      console.log('✅ All required tables exist!');
    }
  } catch (error) {
    console.error('❌ Error checking tables:', error);
  } finally {
    await sql.end();
  }
}

checkTables();
