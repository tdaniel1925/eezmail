-- COMPLETE RESET AND FRESH SYNC SCRIPT
-- This will delete all synced data and force a fresh sync from scratch

-- Step 1: Check current state
SELECT 
  '📊 CURRENT STATE' as status,
  id,
  email_address,
  status,
  sync_status,
  initial_sync_completed
FROM email_accounts
WHERE provider = 'microsoft';

SELECT
  '📧 CURRENT EMAIL COUNT' as status,
  account_id,
  COUNT(*) as email_count
FROM emails
WHERE account_id IN (SELECT id FROM email_accounts WHERE provider = 'microsoft')
GROUP BY account_id;

-- Step 2: Delete all emails for Microsoft accounts
DELETE FROM emails
WHERE account_id IN (
  SELECT id FROM email_accounts WHERE provider = 'microsoft'
);

-- Step 3: Reset all folder sync state
UPDATE email_folders
SET
  sync_cursor = NULL,
  sync_status = 'idle',
  last_sync_at = NULL,
  message_count = 0,
  unread_count = 0,
  updated_at = NOW()
WHERE account_id IN (
  SELECT id FROM email_accounts WHERE provider = 'microsoft'
);

-- Step 4: Reset account sync state
UPDATE email_accounts
SET
  initial_sync_completed = FALSE,
  sync_cursor = NULL,
  sent_sync_cursor = NULL,
  sync_status = 'idle',
  sync_progress = 0,
  status = 'active',
  last_sync_error = NULL,
  last_sync_at = NULL,
  updated_at = NOW()
WHERE provider = 'microsoft';

-- Step 5: Verify reset
SELECT 
  '✅ RESET COMPLETE' as status,
  id,
  email_address,
  status,
  sync_status,
  initial_sync_completed,
  sync_cursor IS NOT NULL as has_delta_link
FROM email_accounts
WHERE provider = 'microsoft';

SELECT
  '📁 FOLDERS RESET' as status,
  name,
  type,
  message_count,
  unread_count,
  sync_cursor IS NOT NULL as has_delta_link
FROM email_folders
WHERE account_id IN (SELECT id FROM email_accounts WHERE provider = 'microsoft')
ORDER BY name;

SELECT
  '📧 EMAILS REMAINING (should be 0)' as status,
  COUNT(*) as total_emails
FROM emails
WHERE account_id IN (SELECT id FROM email_accounts WHERE provider = 'microsoft');

-- ✅ NOW GO TO SETTINGS → EMAIL ACCOUNTS → CLICK "SYNC NOW"
-- ✅ WATCH THE TERMINAL FOR IMPROVED LOGGING
-- ✅ EXPECT TO SEE LARGER BATCH SIZES AND MORE EMAILS

