-- COMPLETE RESET FOR FRESH SYNC WITH FULL CONTENT
-- Run this to stop current sync and prepare for new one

-- Step 1: Reset sync status (stops the "sync in progress" error)
UPDATE email_accounts
SET 
  sync_status = 'idle',
  sync_progress = 0,
  status = 'active'
WHERE provider = 'microsoft';

-- Step 2: Delete all old emails (they have no content anyway)
DELETE FROM emails
WHERE account_id IN (
  SELECT id FROM email_accounts WHERE provider = 'microsoft'
);

-- Step 3: Reset sync state for fresh start
UPDATE email_accounts
SET
  initial_sync_completed = FALSE,
  sync_cursor = NULL,
  sent_sync_cursor = NULL,
  last_sync_error = NULL
WHERE provider = 'microsoft';

-- Step 4: Clear folder sync cursors
UPDATE email_folders
SET
  sync_cursor = NULL,
  sync_status = 'idle',
  last_sync_at = NULL,
  message_count = 0,
  unread_count = 0
WHERE account_id IN (
  SELECT id FROM email_accounts WHERE provider = 'microsoft'
);

-- Step 5: Verify reset
SELECT 
  '✅ Ready for fresh sync with full content!' as status,
  email_address,
  status,
  sync_status,
  sync_progress,
  initial_sync_completed
FROM email_accounts
WHERE provider = 'microsoft';

SELECT
  '📊 Email count (should be 0):' as info,
  COUNT(*) as email_count
FROM emails
WHERE account_id IN (SELECT id FROM email_accounts WHERE provider = 'microsoft');

SELECT
  '📁 Folder sync status:' as info,
  name,
  sync_status,
  message_count,
  (sync_cursor IS NOT NULL) as has_delta_link
FROM email_folders
WHERE account_id IN (SELECT id FROM email_accounts WHERE provider = 'microsoft')
ORDER BY name;

