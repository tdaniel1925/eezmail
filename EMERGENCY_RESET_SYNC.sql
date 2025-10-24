-- EMERGENCY FIX: Reset stuck sync and prepare for working sync
-- Run this in Supabase SQL Editor NOW

-- 1. Reset sync status (stuck as 'syncing')
UPDATE email_accounts
SET 
  sync_status = 'idle',
  sync_progress = 0,
  status = 'active',
  last_sync_error = NULL,
  updated_at = NOW()
WHERE provider = 'microsoft';

-- 2. Verify reset
SELECT 
  email_address,
  status,
  sync_status,
  sync_progress
FROM email_accounts
WHERE provider = 'microsoft';

