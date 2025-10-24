-- FORCE INITIAL SYNC
-- This resets the Microsoft account to trigger a full sync

-- Step 1: Reset the account state
UPDATE email_accounts
SET
  initial_sync_completed = FALSE,
  sync_cursor = NULL,
  sent_sync_cursor = NULL,
  sync_status = 'idle',
  status = 'active',
  last_sync_error = NULL
WHERE provider = 'microsoft'
  AND email_address = 'tdaniel@botmakers.ai';

-- Step 2: Clear all delta links from folders
UPDATE email_folders
SET
  sync_cursor = NULL,
  sync_status = 'idle',
  last_sync_at = NULL
WHERE account_id IN (
  SELECT id FROM email_accounts 
  WHERE provider = 'microsoft'
    AND email_address = 'tdaniel@botmakers.ai'
);

-- Step 3: Verify the reset
SELECT
  '✅ READY FOR INITIAL SYNC' as status,
  email_address,
  status,
  sync_status,
  initial_sync_completed,
  sync_cursor IS NOT NULL as has_delta_link
FROM email_accounts
WHERE provider = 'microsoft'
  AND email_address = 'tdaniel@botmakers.ai';

