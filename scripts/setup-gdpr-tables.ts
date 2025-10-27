/**
 * Quick Database Setup Script for GDPR Tables
 * Run this to create the GDPR tables in your database
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function setupGDPRTables() {
  try {
    console.log('Creating GDPR tables...');

    // Create data_export_requests table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS data_export_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        user_email TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP,
        download_url TEXT,
        error_message TEXT,
        expires_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log('✅ Created data_export_requests table');

    // Create data_deletion_requests table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS data_deletion_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        user_email TEXT NOT NULL,
        reason TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
        scheduled_for TIMESTAMP NOT NULL,
        completed_at TIMESTAMP,
        cancelled_at TIMESTAMP,
        deletion_report JSONB,
        error_message TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log('✅ Created data_deletion_requests table');

    // Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id 
      ON data_export_requests(user_id);
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_data_export_requests_status 
      ON data_export_requests(status);
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_data_export_requests_requested_at 
      ON data_export_requests(requested_at DESC);
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_id 
      ON data_deletion_requests(user_id);
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status 
      ON data_deletion_requests(status);
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_requested_at 
      ON data_deletion_requests(requested_at DESC);
    `);

    console.log('✅ Created indexes');
    console.log('🎉 GDPR tables setup complete!');
  } catch (error) {
    console.error('❌ Error setting up GDPR tables:', error);
    throw error;
  }
}

// Run the setup
setupGDPRTables()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
