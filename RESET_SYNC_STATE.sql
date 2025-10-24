-- CRITICAL FIX: Clear all delta links to force FULL sync
-- This removes the broken delta links from the old sync system

UPDATE email_folders
SET sync_cursor = NULL,
    sync_status = 'idle',
    last_sync_at = NULL
WHERE account_id IN (
    SELECT id FROM email_accounts WHERE provider = 'microsoft'
);

-- Also reset the account sync status
UPDATE email_accounts
SET initial_sync_completed = FALSE,
    sync_cursor = NULL,
    sent_sync_cursor = NULL,
    last_sync_at = NULL
WHERE provider = 'microsoft';

-- Verify the reset
SELECT 
    'Folders cleared:' as status,
    COUNT(*) as count
FROM email_folders
WHERE account_id IN (SELECT id FROM email_accounts WHERE provider = 'microsoft')
  AND sync_cursor IS NULL;

SELECT 
    'Account reset:' as status,
    email_address,
    initial_sync_completed,
    sync_cursor IS NULL as cursor_cleared
FROM email_accounts
WHERE provider = 'microsoft';

