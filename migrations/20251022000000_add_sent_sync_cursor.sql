-- Migration: Add sent folder sync cursor
-- Description: Add sentSyncCursor column to email_accounts for tracking sent folder sync state
-- Date: 2025-10-22

-- Add sent_sync_cursor column to email_accounts table
ALTER TABLE email_accounts 
ADD COLUMN IF NOT EXISTS sent_sync_cursor TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_email_accounts_sent_sync_cursor 
ON email_accounts(sent_sync_cursor) 
WHERE sent_sync_cursor IS NOT NULL;

-- Comment
COMMENT ON COLUMN email_accounts.sent_sync_cursor IS 'Delta sync cursor for sent folder (Microsoft Graph API)';


