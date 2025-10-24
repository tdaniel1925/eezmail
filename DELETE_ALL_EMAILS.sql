-- ====================================================
-- COMPLETE SYNC RESET FOR MICROSOFT ACCOUNTS
-- ====================================================
-- This script will:
-- 1. Delete all existing emails for Microsoft accounts
-- 2. Clear all delta links to force full sync
-- 3. Reset sync state flags
-- 4. Prepare account for fresh Inngest sync
--
-- Run this in Supabase SQL Editor BEFORE clicking "Sync Now"
-- ====================================================

-- Step 1: Count emails before deletion (for verification)
SELECT 
  'BEFORE DELETION' as status,
  COUNT(*) as email_count,
  COUNT(DISTINCT account_id) as account_count
FROM emails
WHERE account_id IN (
  SELECT id FROM email_accounts WHERE provider = 'microsoft'
);

-- Step 2: Show current account state
SELECT 
  email_address,
  provider,
  status,
  sync_status,
  initial_sync_completed,
  sync_cursor IS NOT NULL as has_delta_link,
  last_sync_at,
  created_at
FROM email_accounts 
WHERE provider = 'microsoft';

-- Step 3: DELETE ALL EMAILS for Microsoft accounts
DELETE FROM emails
WHERE account_id IN (
  SELECT id FROM email_accounts WHERE provider = 'microsoft'
);

-- Step 4: Clear all delta links from folders
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

-- Step 5: Reset account sync state
UPDATE email_accounts
SET 
  initial_sync_completed = FALSE,
  sync_cursor = NULL,
  sent_sync_cursor = NULL,
  sync_status = 'idle',
  status = 'active',
  last_sync_error = NULL,
  sync_progress = 0,
  updated_at = NOW()
WHERE provider = 'microsoft';

-- Step 6: Verify deletion (should show 0 emails)
SELECT 
  'AFTER DELETION' as status,
  COUNT(*) as remaining_emails
FROM emails
WHERE account_id IN (
  SELECT id FROM email_accounts WHERE provider = 'microsoft'
);

-- Step 7: Verify folder state (all should have no delta links)
SELECT 
  name,
  type,
  message_count,
  unread_count,
  sync_status,
  sync_cursor IS NOT NULL as has_delta_link
FROM email_folders
WHERE account_id IN (
  SELECT id FROM email_accounts WHERE provider = 'microsoft'
)
ORDER BY name;

-- Step 8: Verify account state (ready for sync)
SELECT 
  '✅ READY FOR FRESH SYNC' as status,
  email_address,
  status,
  sync_status,
  initial_sync_completed,
  sync_cursor IS NOT NULL as has_delta_link
FROM email_accounts 
WHERE provider = 'microsoft';

-- ====================================================
-- ✅ EXPECTED RESULTS:
-- - BEFORE: 218 emails
-- - AFTER: 0 emails
-- - Account: status='active', sync_status='idle', initial_sync_completed=FALSE
-- - Folders: All have message_count=0, sync_cursor=NULL
-- 
-- ✅ NEXT STEPS:
-- 1. Refresh your browser (Ctrl+Shift+R)
-- 2. Go to Settings → Email Accounts
-- 3. Click "Sync Now" button
-- 4. Watch terminal for Inngest sync logs
-- 5. Verify all 5,315+ emails sync correctly
-- ====================================================
