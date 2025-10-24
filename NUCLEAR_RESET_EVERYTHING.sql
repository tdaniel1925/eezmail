-- NUCLEAR RESET: Delete ALL emails and reset sync state
-- This will give you a completely fresh start

-- Step 1: Delete ALL emails for this Microsoft account
DELETE FROM emails
WHERE account_id = '26ddbb0d-12f4-422b-8a33-fd1e8072e33c';

-- Step 2: Reset the account sync state completely
UPDATE email_accounts
SET
  initial_sync_completed = FALSE,
  sync_cursor = NULL,
  sent_sync_cursor = NULL,
  sync_status = 'idle',
  sync_progress = 0,
  status = 'active',
  last_sync_error = NULL,
  last_sync_at = NULL
WHERE id = '26ddbb0d-12f4-422b-8a33-fd1e8072e33c';

-- Step 3: Reset ALL folders for this account
UPDATE email_folders
SET
  sync_cursor = NULL,
  sync_status = 'idle',
  last_sync_at = NULL,
  message_count = 0,
  unread_count = 0
WHERE account_id = '26ddbb0d-12f4-422b-8a33-fd1e8072e33c';

-- Step 4: Verify the reset (should show 0 emails, FALSE for initial_sync_completed)
SELECT 
  '✅ ACCOUNT RESET' as status,
  email_address,
  initial_sync_completed,
  sync_status,
  sync_progress,
  (sync_cursor IS NOT NULL) as has_delta_link
FROM email_accounts
WHERE id = '26ddbb0d-12f4-422b-8a33-fd1e8072e33c';

SELECT
  '📁 FOLDERS RESET' as status,
  name,
  message_count,
  unread_count,
  (sync_cursor IS NOT NULL) as has_delta_link
FROM email_folders
WHERE account_id = '26ddbb0d-12f4-422b-8a33-fd1e8072e33c'
ORDER BY name;

SELECT
  '📧 EMAILS COUNT (should be 0)' as status,
  COUNT(*) as total_emails
FROM emails
WHERE account_id = '26ddbb0d-12f4-422b-8a33-fd1e8072e33c';

