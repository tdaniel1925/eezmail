-- Migration: Add is_trashed field for chatbot features
-- Created: 2025-01-16
-- Purpose: Add is_trashed field and newsletter category value

-- Step 1: Add is_trashed boolean field
ALTER TABLE emails 
ADD COLUMN IF NOT EXISTS is_trashed BOOLEAN DEFAULT false NOT NULL;

-- Step 2: Add index for performance
CREATE INDEX IF NOT EXISTS idx_emails_is_trashed ON emails(is_trashed) WHERE is_trashed = true;

-- Step 3: Update email_category enum to include 'newsletter'
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

-- Step 4: Add comment
COMMENT ON COLUMN emails.is_trashed IS 'Whether the email is in trash (soft delete)';

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Added column: is_trashed';
    RAISE NOTICE 'Added newsletter to email_category_enum';
END $$;

