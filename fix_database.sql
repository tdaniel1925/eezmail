-- Fix missing is_trashed column and other database issues

-- 1. Add is_trashed column to emails table
ALTER TABLE emails
ADD COLUMN IF NOT EXISTS is_trashed BOOLEAN DEFAULT FALSE NOT NULL;

-- 2. Update email_category enum to include 'newsletter'
DO $$
BEGIN
    -- Check if 'newsletter' already exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'newsletter' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'email_category')
    ) THEN
        ALTER TYPE email_category ADD VALUE 'newsletter';
    END IF;
END
$$;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_emails_is_trashed ON emails(is_trashed) WHERE is_trashed = false;
CREATE INDEX IF NOT EXISTS idx_emails_category ON emails(email_category);
CREATE INDEX IF NOT EXISTS idx_emails_account_category ON emails(account_id, email_category);

