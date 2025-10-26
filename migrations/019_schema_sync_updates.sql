-- Migration: Schema updates for Gmail and IMAP sync
-- Description: Adds missing fields needed for email sync across all providers
-- Author: Imbox Team
-- Date: 2025-10-26

-- =============================================================================
-- EMAIL ACCOUNTS: Add sync-related fields
-- =============================================================================

-- Add lastSyncedAt timestamp
ALTER TABLE email_accounts
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Add lastSyncCursor for delta sync
ALTER TABLE email_accounts
ADD COLUMN IF NOT EXISTS last_sync_cursor TEXT;

-- Add imapConfig for IMAP-specific settings
ALTER TABLE email_accounts
ADD COLUMN IF NOT EXISTS imap_config JSONB;

COMMENT ON COLUMN email_accounts.last_synced_at IS 'Alternative timestamp field for last sync completion';
COMMENT ON COLUMN email_accounts.last_sync_cursor IS 'Delta sync cursor (e.g., Gmail historyId, Microsoft deltaLink)';
COMMENT ON COLUMN email_accounts.imap_config IS 'IMAP-specific configuration (e.g., UID validity, flags)';

-- =============================================================================
-- EMAIL FOLDERS: Add provider and sync fields
-- =============================================================================

-- Add providerId for external folder reference
ALTER TABLE email_folders
ADD COLUMN IF NOT EXISTS provider_id TEXT;

-- Add lastSyncedAt timestamp
ALTER TABLE email_folders
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Add lastSyncCursor for incremental folder sync
ALTER TABLE email_folders
ADD COLUMN IF NOT EXISTS last_sync_cursor TEXT;

COMMENT ON COLUMN email_folders.provider_id IS 'External folder ID from email provider (same as external_id, but explicit)';
COMMENT ON COLUMN email_folders.last_synced_at IS 'Last time this folder was successfully synced';
COMMENT ON COLUMN email_folders.last_sync_cursor IS 'Cursor for incremental sync of this folder';

-- Create index for provider_id lookups
CREATE INDEX IF NOT EXISTS email_folders_provider_id_idx ON email_folders(provider_id);

-- =============================================================================
-- EMAILS: Add folder link and provider ID
-- =============================================================================

-- Add folderId to link emails to folders
ALTER TABLE emails
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES email_folders(id) ON DELETE SET NULL;

-- Add providerId for external message reference
ALTER TABLE emails
ADD COLUMN IF NOT EXISTS provider_id TEXT;

COMMENT ON COLUMN emails.folder_id IS 'Link to the email folder this email belongs to';
COMMENT ON COLUMN emails.provider_id IS 'External message ID from email provider (same as provider_message_id, but explicit)';

-- Create index for folder lookups
CREATE INDEX IF NOT EXISTS emails_folder_id_idx ON emails(folder_id);

-- Create index for provider_id lookups
CREATE INDEX IF NOT EXISTS emails_provider_id_idx ON emails(provider_id);

-- =============================================================================
-- SYNC JOBS: Add progress tracking fields
-- =============================================================================

-- Add syncType for job classification
ALTER TABLE sync_jobs
ADD COLUMN IF NOT EXISTS sync_type TEXT DEFAULT 'incremental';

-- Add emailsProcessed counter
ALTER TABLE sync_jobs
ADD COLUMN IF NOT EXISTS emails_processed INTEGER DEFAULT 0;

-- Add emailsFailed counter
ALTER TABLE sync_jobs
ADD COLUMN IF NOT EXISTS emails_failed INTEGER DEFAULT 0;

COMMENT ON COLUMN sync_jobs.sync_type IS 'Type of sync: full or incremental';
COMMENT ON COLUMN sync_jobs.emails_processed IS 'Number of emails successfully processed';
COMMENT ON COLUMN sync_jobs.emails_failed IS 'Number of emails that failed to process';

-- =============================================================================
-- DATA MIGRATION: Copy existing values to new fields (if needed)
-- =============================================================================

-- Copy external_id to provider_id for folders
UPDATE email_folders
SET provider_id = external_id
WHERE provider_id IS NULL AND external_id IS NOT NULL;

-- Copy provider_message_id to provider_id for emails
UPDATE emails
SET provider_id = provider_message_id
WHERE provider_id IS NULL AND provider_message_id IS NOT NULL;

-- Copy sync_cursor to last_sync_cursor for accounts
UPDATE email_accounts
SET last_sync_cursor = sync_cursor
WHERE last_sync_cursor IS NULL AND sync_cursor IS NOT NULL;

-- Copy last_sync_at to last_synced_at for accounts
UPDATE email_accounts
SET last_synced_at = last_sync_at
WHERE last_synced_at IS NULL AND last_sync_at IS NOT NULL;

-- =============================================================================
-- VERIFICATION: Check that all tables have the new columns
-- =============================================================================

DO $$
DECLARE
  v_missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check email_accounts columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_accounts' AND column_name = 'last_synced_at'
  ) THEN
    v_missing_columns := array_append(v_missing_columns, 'email_accounts.last_synced_at');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_accounts' AND column_name = 'last_sync_cursor'
  ) THEN
    v_missing_columns := array_append(v_missing_columns, 'email_accounts.last_sync_cursor');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_accounts' AND column_name = 'imap_config'
  ) THEN
    v_missing_columns := array_append(v_missing_columns, 'email_accounts.imap_config');
  END IF;

  -- Check email_folders columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_folders' AND column_name = 'provider_id'
  ) THEN
    v_missing_columns := array_append(v_missing_columns, 'email_folders.provider_id');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_folders' AND column_name = 'last_synced_at'
  ) THEN
    v_missing_columns := array_append(v_missing_columns, 'email_folders.last_synced_at');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_folders' AND column_name = 'last_sync_cursor'
  ) THEN
    v_missing_columns := array_append(v_missing_columns, 'email_folders.last_sync_cursor');
  END IF;

  -- Check emails columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'emails' AND column_name = 'folder_id'
  ) THEN
    v_missing_columns := array_append(v_missing_columns, 'emails.folder_id');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'emails' AND column_name = 'provider_id'
  ) THEN
    v_missing_columns := array_append(v_missing_columns, 'emails.provider_id');
  END IF;

  -- Check sync_jobs columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sync_jobs' AND column_name = 'sync_type'
  ) THEN
    v_missing_columns := array_append(v_missing_columns, 'sync_jobs.sync_type');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sync_jobs' AND column_name = 'emails_processed'
  ) THEN
    v_missing_columns := array_append(v_missing_columns, 'sync_jobs.emails_processed');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sync_jobs' AND column_name = 'emails_failed'
  ) THEN
    v_missing_columns := array_append(v_missing_columns, 'sync_jobs.emails_failed');
  END IF;

  -- Report results
  IF array_length(v_missing_columns, 1) > 0 THEN
    RAISE WARNING 'Migration incomplete! Missing columns: %', array_to_string(v_missing_columns, ', ');
  ELSE
    RAISE NOTICE '✅ Migration 019 complete! All columns successfully added.';
  END IF;
END $$;

