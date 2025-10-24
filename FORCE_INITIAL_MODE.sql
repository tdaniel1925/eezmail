-- FORCE INITIAL SYNC MODE
-- This ensures the next sync will be a FULL sync, not incremental

-- Reset initial_sync_completed to FALSE (this is the critical flag!)
UPDATE email_accounts
SET
  initial_sync_completed = FALSE,
  sync_cursor = NULL,
  sent_sync_cursor = NULL,
  sync_status = 'idle',
  sync_progress = 0,
  last_sync_error = NULL
WHERE provider = 'microsoft';

-- Clear all folder delta links
UPDATE email_folders
SET
  sync_cursor = NULL,
  sync_status = 'idle'
WHERE account_id IN (
  SELECT id FROM email_accounts WHERE provider = 'microsoft'
);

-- Verify the change
SELECT 
  '✅ FORCED INITIAL MODE' as status,
  email_address,
  initial_sync_completed,
  (sync_cursor IS NOT NULL) as has_account_delta,
  sync_status
FROM email_accounts
WHERE provider = 'microsoft';

SELECT
  name,
  (sync_cursor IS NOT NULL) as has_folder_delta
FROM email_folders
WHERE account_id IN (SELECT id FROM email_accounts WHERE provider = 'microsoft')
ORDER BY name;

