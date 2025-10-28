-- Clean Slate Sync Reset Migration
-- This clears all emails and resets sync state for the sync system overhaul

-- Clear all emails (cascade will handle attachments, threads, etc.)
DELETE FROM emails;

-- Reset all account sync states
UPDATE email_accounts SET
  status = 'active',
  sync_status = 'idle',
  sync_progress = 0,
  sync_total = 0,
  initial_sync_completed = false,
  sync_cursor = NULL,
  last_sync_at = NULL,
  last_successful_sync_at = NULL,
  last_sync_error = NULL,
  error_count = 0,
  consecutive_errors = 0;

-- Clear folder sync cursors
UPDATE email_folders SET
  sync_cursor = NULL,
  last_sync_at = NULL;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Clean slate sync reset complete';
END $$;

