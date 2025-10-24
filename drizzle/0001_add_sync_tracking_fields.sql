-- Add sync completion tracking fields to email_accounts table
ALTER TABLE email_accounts 
ADD COLUMN IF NOT EXISTS initial_sync_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE email_accounts 
ADD COLUMN IF NOT EXISTS gmail_history_id TEXT;

-- Add comment for documentation
COMMENT ON COLUMN email_accounts.initial_sync_completed IS 'Tracks whether the initial full sync has completed. Only use delta/incremental sync if true.';
COMMENT ON COLUMN email_accounts.gmail_history_id IS 'Gmail History API cursor for incremental sync. Stores the historyId from the last successful sync.';

