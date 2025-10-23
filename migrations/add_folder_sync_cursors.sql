-- Migration: Add per-folder sync tracking to email_folders
-- Purpose: Enable independent sync cursors for each folder to prevent re-syncing all messages

-- Add sync tracking columns
ALTER TABLE email_folders
ADD COLUMN IF NOT EXISTS sync_cursor TEXT,
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'idle';

-- Add index for last_sync_at for querying stale folders
CREATE INDEX IF NOT EXISTS email_folders_last_sync_at_idx ON email_folders(last_sync_at);

-- Add comments
COMMENT ON COLUMN email_folders.sync_cursor IS 'Provider-specific sync cursor (delta link or page token) for this folder';
COMMENT ON COLUMN email_folders.last_sync_at IS 'When this folder was last successfully synced';
COMMENT ON COLUMN email_folders.sync_status IS 'Current sync status: idle, syncing, error';

