-- QUICK FIX: Reset stuck sync status
-- Run this to clear the "sync in progress" message

UPDATE email_accounts
SET 
  sync_status = 'idle',
  sync_progress = 0
WHERE provider = 'microsoft';

-- Verify it's fixed
SELECT 
  email_address,
  status,
  sync_status,
  sync_progress,
  last_sync_error
FROM email_accounts
WHERE provider = 'microsoft';

