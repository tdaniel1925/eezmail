-- Migration: Add missing email fields for chatbot Phase 1 & 2 features
-- Created: 2025-01-16
-- Purpose: Add is_read, is_starred, is_trashed fields and update email_category enum

-- Step 1: Add boolean tracking fields
ALTER TABLE emails 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS is_trashed BOOLEAN DEFAULT false NOT NULL;

-- Step 2: Add indexes for the new fields (performance optimization)
CREATE INDEX IF NOT EXISTS idx_emails_is_read ON emails(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_emails_is_starred ON emails(is_starred) WHERE is_starred = true;
CREATE INDEX IF NOT EXISTS idx_emails_is_trashed ON emails(is_trashed) WHERE is_trashed = true;

-- Step 3: Update email_category enum to include 'newsletter'
-- Note: PostgreSQL doesn't allow direct modification of enums, so we need to add the value
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

-- Step 4: Migrate existing data (optional but recommended)
-- Mark emails in spam folder as trashed
UPDATE emails SET is_trashed = true WHERE folder_name = 'spam';

-- Mark emails in trash-related folders as trashed
UPDATE emails SET is_trashed = true WHERE folder_name LIKE '%trash%' OR folder_name LIKE '%deleted%';

-- Optionally: Mark all emails as read (since we don't have historical read status)
-- Uncomment the line below if you want to assume existing emails were read:
-- UPDATE emails SET is_read = true WHERE received_at < NOW() - INTERVAL '7 days';

-- Step 5: Add comment documentation
COMMENT ON COLUMN emails.is_read IS 'Whether the email has been read by the user';
COMMENT ON COLUMN emails.is_starred IS 'Whether the email is starred/flagged as important';
COMMENT ON COLUMN emails.is_trashed IS 'Whether the email is in trash (soft delete)';

-- Verification query - Run this to check the migration
-- SELECT 
--     COUNT(*) as total_emails,
--     COUNT(*) FILTER (WHERE is_read) as read_count,
--     COUNT(*) FILTER (WHERE is_starred) as starred_count,
--     COUNT(*) FILTER (WHERE is_trashed) as trashed_count
-- FROM emails;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Added columns: is_read, is_starred, is_trashed';
    RAISE NOTICE 'Created indexes for performance optimization';
    RAISE NOTICE 'Updated email_category_enum to include newsletter';
END $$;

