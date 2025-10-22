-- Fix IMAP Account Status
-- Run this in Supabase SQL Editor to clear 'error' status and reconnection issues

-- Update IMAP accounts that have 'error' status back to 'active'
-- IMAP accounts use password auth and don't expire, so 'error' status 
-- is often just from the old bug checking for refresh tokens

UPDATE email_accounts
SET 
  status = 'active',
  last_sync_error = NULL,
  consecutive_errors = 0,
  updated_at = NOW()
WHERE 
  provider = 'imap'
  AND status = 'error'
  AND access_token IS NOT NULL; -- Only fix accounts that have passwords

-- Show updated accounts
SELECT 
  id,
  email_address,
  provider,
  status,
  last_sync_error,
  (access_token IS NOT NULL) as has_password,
  last_sync_at,
  updated_at
FROM email_accounts
WHERE provider = 'imap';

