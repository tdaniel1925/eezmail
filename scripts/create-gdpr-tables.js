#!/usr/bin/env node

/**
 * Quick script to create GDPR tables via Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  console.log('🔨 Creating GDPR tables...');

  try {
    // Create data_export_requests table
    const { error: exportError } = await supabase.rpc('exec_sql', {
      sql: `
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

        CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id 
        ON data_export_requests(user_id);
        
        CREATE INDEX IF NOT EXISTS idx_data_export_requests_status 
        ON data_export_requests(status);
        
        CREATE INDEX IF NOT EXISTS idx_data_export_requests_requested_at 
        ON data_export_requests(requested_at DESC);
      `,
    });

    if (exportError) {
      console.error('❌ Error creating export table:', exportError);
    } else {
      console.log('✅ Created data_export_requests table');
    }

    // Create data_deletion_requests table
    const { error: deletionError } = await supabase.rpc('exec_sql', {
      sql: `
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

        CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_user_id 
        ON data_deletion_requests(user_id);
        
        CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_status 
        ON data_deletion_requests(status);
        
        CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_requested_at 
        ON data_deletion_requests(requested_at DESC);
      `,
    });

    if (deletionError) {
      console.error('❌ Error creating deletion table:', deletionError);
    } else {
      console.log('✅ Created data_deletion_requests table');
    }

    console.log('🎉 GDPR tables setup complete!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTables();
