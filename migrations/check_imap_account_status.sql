-- Check IMAP Account Status
-- Run this in Supabase SQL Editor

SELECT 
  id,
  email_address,
  provider,
  auth_type,
  status,
  last_sync_error,
  last_sync_at,
  (access_token IS NOT NULL) as has_password,
  (refresh_token IS NOT NULL) as has_refresh_token,
  token_expires_at,
  created_at,
  updated_at
FROM email_accounts
WHERE email_address = 'tdaniel@botmakers.ai'
  OR provider = 'imap';

