-- IMMEDIATE FIX: Reset stuck sync status
UPDATE email_accounts
SET 
  sync_status = 'idle',
  sync_progress = 0,
  status = 'error',
  last_sync_error = 'Token expired - please reconnect your Microsoft account'
WHERE provider = 'microsoft';

-- Verify the fix
SELECT 
  email_address,
  status,
  sync_status,
  sync_progress,
  last_sync_error
FROM email_accounts
WHERE provider = 'microsoft';

