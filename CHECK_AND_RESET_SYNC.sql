-- Check current sync status
SELECT 
  id,
  email_address,
  provider,
  status,
  sync_status,
  sync_progress,
  last_sync_at,
  last_sync_error,
  initial_sync_completed
FROM email_accounts
WHERE provider = 'microsoft';

-- If sync appears stuck, reset it:
-- UPDATE email_accounts
-- SET sync_status = 'idle'
-- WHERE provider = 'microsoft' AND sync_status = 'syncing';

