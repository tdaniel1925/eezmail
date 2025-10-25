-- Migration: Add attachment auto-download settings to email_settings table
-- Created: 2025-10-25

ALTER TABLE email_settings 
ADD COLUMN IF NOT EXISTS download_attachments_at_sync BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS max_auto_download_size_mb INTEGER NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS auto_download_days_back INTEGER NOT NULL DEFAULT 30,
ADD COLUMN IF NOT EXISTS download_all_attachments BOOLEAN NOT NULL DEFAULT false;

-- Add comments for clarity
COMMENT ON COLUMN email_settings.download_attachments_at_sync IS 'Whether to automatically download attachments during email sync';
COMMENT ON COLUMN email_settings.max_auto_download_size_mb IS 'Maximum file size (in MB) to auto-download';
COMMENT ON COLUMN email_settings.auto_download_days_back IS 'Only auto-download attachments from emails received in last N days';
COMMENT ON COLUMN email_settings.download_all_attachments IS 'Override other settings to download ALL attachments regardless of size/age';

