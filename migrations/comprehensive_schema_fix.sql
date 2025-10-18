-- Comprehensive Database Schema Fix
-- Created: 2025-01-16
-- Purpose: Fix ALL database schema issues for production-ready email platform

-- Step 1: Add missing boolean tracking fields
ALTER TABLE emails 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS is_trashed BOOLEAN DEFAULT false NOT NULL;

-- Step 2: Add missing voice message fields
ALTER TABLE emails 
ADD COLUMN IF NOT EXISTS voice_message_url TEXT,
ADD COLUMN IF NOT EXISTS voice_message_duration INTEGER,
ADD COLUMN IF NOT EXISTS has_voice_message BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS voice_message_format TEXT,
ADD COLUMN IF NOT EXISTS voice_message_size INTEGER;

-- Step 3: Add missing user settings fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS voice_settings JSONB,
ADD COLUMN IF NOT EXISTS ai_preferences JSONB,
ADD COLUMN IF NOT EXISTS notification_settings JSONB;

-- Step 4: Add missing indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_emails_is_read ON emails(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_emails_is_starred ON emails(is_starred) WHERE is_starred = true;
CREATE INDEX IF NOT EXISTS idx_emails_is_trashed ON emails(is_trashed) WHERE is_trashed = true;
CREATE INDEX IF NOT EXISTS idx_emails_has_voice_message ON emails(has_voice_message) WHERE has_voice_message = true;
CREATE INDEX IF NOT EXISTS idx_emails_voice_message_url ON emails(voice_message_url) WHERE voice_message_url IS NOT NULL;

-- Step 5: Update email_category enum to include 'newsletter'
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'newsletter' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'email_category_enum')
    ) THEN
        ALTER TYPE email_category_enum ADD VALUE 'newsletter';
    END IF;
END $$;

-- Step 6: Add missing constraints and relationships
-- Ensure proper foreign key relationships
ALTER TABLE emails 
ADD CONSTRAINT IF NOT EXISTS fk_emails_account_id 
FOREIGN KEY (account_id) REFERENCES email_accounts(id) ON DELETE CASCADE;

-- Step 7: Migrate existing data
-- Mark emails in spam folder as trashed
UPDATE emails SET is_trashed = true WHERE folder_name = 'spam';

-- Mark emails in trash-related folders as trashed
UPDATE emails SET is_trashed = true WHERE folder_name LIKE '%trash%' OR folder_name LIKE '%deleted%';

-- Step 8: Add comment documentation
COMMENT ON COLUMN emails.is_read IS 'Whether the email has been read by the user';
COMMENT ON COLUMN emails.is_starred IS 'Whether the email is starred/flagged as important';
COMMENT ON COLUMN emails.is_trashed IS 'Whether the email is in trash (soft delete)';
COMMENT ON COLUMN emails.voice_message_url IS 'URL to the voice message audio file';
COMMENT ON COLUMN emails.voice_message_duration IS 'Duration of voice message in seconds';
COMMENT ON COLUMN emails.has_voice_message IS 'Whether the email contains a voice message';
COMMENT ON COLUMN users.voice_settings IS 'User voice recording and playback preferences';
COMMENT ON COLUMN users.ai_preferences IS 'User AI assistant preferences and settings';
COMMENT ON COLUMN users.notification_settings IS 'User notification preferences';

-- Step 9: Create performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_emails_account_category ON emails(account_id, email_category);
CREATE INDEX IF NOT EXISTS idx_emails_received_at_desc ON emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_screening_status ON emails(screening_status);
CREATE INDEX IF NOT EXISTS idx_emails_hey_view ON emails(hey_view);

-- Step 10: Verification queries
-- Run these to verify the migration worked:
-- SELECT 
--     COUNT(*) as total_emails,
--     COUNT(*) FILTER (WHERE is_read) as read_count,
--     COUNT(*) FILTER (WHERE is_starred) as starred_count,
--     COUNT(*) FILTER (WHERE is_trashed) as trashed_count,
--     COUNT(*) FILTER (WHERE has_voice_message) as voice_message_count
-- FROM emails;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Comprehensive schema migration completed successfully!';
    RAISE NOTICE 'Added columns: is_read, is_starred, is_trashed, voice_message_url, voice_message_duration, has_voice_message';
    RAISE NOTICE 'Added user settings: voice_settings, ai_preferences, notification_settings';
    RAISE NOTICE 'Created performance indexes for optimization';
    RAISE NOTICE 'Updated email_category_enum to include newsletter';
    RAISE NOTICE 'Database is now production-ready!';
END $$;


