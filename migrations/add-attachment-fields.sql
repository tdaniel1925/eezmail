-- Add new fields to email_attachments table
-- Run this migration in your Supabase SQL editor

-- Add account_id column
ALTER TABLE email_attachments 
ADD COLUMN IF NOT EXISTS account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE;

-- Add user_id column
ALTER TABLE email_attachments 
ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL;

-- Add original_filename column
ALTER TABLE email_attachments 
ADD COLUMN IF NOT EXISTS original_filename TEXT NOT NULL DEFAULT '';

-- Add download_status column
ALTER TABLE email_attachments 
ADD COLUMN IF NOT EXISTS download_status TEXT DEFAULT 'pending';

-- Add email context columns for search
ALTER TABLE email_attachments 
ADD COLUMN IF NOT EXISTS email_subject TEXT;

ALTER TABLE email_attachments 
ADD COLUMN IF NOT EXISTS email_from TEXT;

ALTER TABLE email_attachments 
ADD COLUMN IF NOT EXISTS email_received_at TIMESTAMP;

-- Add search and organization columns
ALTER TABLE email_attachments 
ADD COLUMN IF NOT EXISTS extracted_text TEXT;

ALTER TABLE email_attachments 
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Add security columns
ALTER TABLE email_attachments 
ADD COLUMN IF NOT EXISTS is_scanned BOOLEAN DEFAULT FALSE NOT NULL;

ALTER TABLE email_attachments 
ADD COLUMN IF NOT EXISTS is_safe BOOLEAN DEFAULT TRUE NOT NULL;

ALTER TABLE email_attachments 
ADD COLUMN IF NOT EXISTS scan_result TEXT;

-- Add updated_at column
ALTER TABLE email_attachments 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW() NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS email_attachments_user_id_idx ON email_attachments(user_id);
CREATE INDEX IF NOT EXISTS email_attachments_account_id_idx ON email_attachments(account_id);
CREATE INDEX IF NOT EXISTS email_attachments_email_received_at_idx ON email_attachments(email_received_at DESC);

-- Add comment
COMMENT ON TABLE email_attachments IS 'Stores metadata and download status for email attachments with on-demand fetching';



