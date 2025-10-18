import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function POST() {
  try {
    console.log('🔧 Starting database migration...');

    // Read the migration file
    const migrationSQL = `
      -- Add missing columns to emails table
      DO $$ 
      BEGIN
        -- Add is_read if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'is_read') THEN
          ALTER TABLE emails ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
        END IF;
        
        -- Add is_starred if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'is_starred') THEN
          ALTER TABLE emails ADD COLUMN is_starred BOOLEAN DEFAULT FALSE;
        END IF;
        
        -- Add is_trashed if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'is_trashed') THEN
          ALTER TABLE emails ADD COLUMN is_trashed BOOLEAN DEFAULT FALSE;
        END IF;
        
        -- Add voice_message_url if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'voice_message_url') THEN
          ALTER TABLE emails ADD COLUMN voice_message_url TEXT;
        END IF;
        
        -- Add voice_message_duration if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'voice_message_duration') THEN
          ALTER TABLE emails ADD COLUMN voice_message_duration INTEGER;
        END IF;
        
        -- Add has_voice_message if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'has_voice_message') THEN
          ALTER TABLE emails ADD COLUMN has_voice_message BOOLEAN DEFAULT FALSE;
        END IF;
        
        -- Add voice_message_format if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'voice_message_format') THEN
          ALTER TABLE emails ADD COLUMN voice_message_format TEXT;
        END IF;
        
        -- Add voice_message_size if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'voice_message_size') THEN
          ALTER TABLE emails ADD COLUMN voice_message_size INTEGER;
        END IF;
        
        -- Add voice_settings to users if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'voice_settings') THEN
          ALTER TABLE users ADD COLUMN voice_settings JSONB;
        END IF;
        
        -- Add ai_preferences to users if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'ai_preferences') THEN
          ALTER TABLE users ADD COLUMN ai_preferences JSONB;
        END IF;
        
        -- Add notification_settings to users if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'notification_settings') THEN
          ALTER TABLE users ADD COLUMN notification_settings JSONB;
        END IF;
      END $$;

      -- Create performance indexes
      CREATE INDEX IF NOT EXISTS idx_emails_is_read ON emails(is_read) WHERE is_read = false;
      CREATE INDEX IF NOT EXISTS idx_emails_is_starred ON emails(is_starred) WHERE is_starred = true;
      CREATE INDEX IF NOT EXISTS idx_emails_is_trashed ON emails(is_trashed) WHERE is_trashed = true;
      CREATE INDEX IF NOT EXISTS idx_emails_has_voice_message ON emails(has_voice_message) WHERE has_voice_message = true;
      CREATE INDEX IF NOT EXISTS idx_emails_voice_message_url ON emails(voice_message_url) WHERE voice_message_url IS NOT NULL;
    `;

    // Execute the migration
    await db.execute(sql.raw(migrationSQL));

    console.log('✅ Database migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
