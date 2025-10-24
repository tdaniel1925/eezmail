-- ============================================
-- Check Microsoft Account Token Status
-- ============================================

-- 1. Check all Microsoft accounts and their token status
SELECT
  id,
  email_address,
  status,
  sync_status,
  token_expires_at,
  CASE
    WHEN token_expires_at IS NULL THEN '❌ No expiry date'
    WHEN token_expires_at < NOW() THEN '❌ EXPIRED'
    WHEN token_expires_at < NOW() + INTERVAL '5 minutes' THEN '⚠️ Expiring soon'
    ELSE '✅ Valid'
  END as token_status,
  EXTRACT(EPOCH FROM (token_expires_at - NOW())) / 60 as minutes_until_expiry,
  access_token IS NOT NULL as has_access_token,
  refresh_token IS NOT NULL as has_refresh_token,
  last_sync_error
FROM email_accounts
WHERE provider = 'microsoft'
ORDER BY created_at DESC;

-- 2. Check if tokens exist but are too short (might be corrupted)
SELECT
  id,
  email_address,
  LENGTH(access_token) as access_token_length,
  LENGTH(refresh_token) as refresh_token_length,
  CASE
    WHEN access_token IS NULL THEN '❌ No access token'
    WHEN LENGTH(access_token) < 100 THEN '⚠️ Access token too short'
    ELSE '✅ Access token looks valid'
  END as access_token_check,
  CASE
    WHEN refresh_token IS NULL THEN '❌ No refresh token'
    WHEN LENGTH(refresh_token) < 50 THEN '⚠️ Refresh token too short'
    ELSE '✅ Refresh token looks valid'
  END as refresh_token_check
FROM email_accounts
WHERE provider = 'microsoft';

-- 3. Show token expiry times in readable format
SELECT
  email_address,
  token_expires_at,
  NOW() as current_time,
  token_expires_at - NOW() as time_until_expiry,
  CASE
    WHEN token_expires_at < NOW() THEN 'Need to refresh NOW'
    WHEN token_expires_at < NOW() + INTERVAL '5 minutes' THEN 'Will refresh soon'
    WHEN token_expires_at < NOW() + INTERVAL '30 minutes' THEN 'Valid for ' || ROUND(EXTRACT(EPOCH FROM (token_expires_at - NOW())) / 60) || ' minutes'
    ELSE 'Valid for ' || ROUND(EXTRACT(EPOCH FROM (token_expires_at - NOW())) / 3600, 1) || ' hours'
  END as status_message
FROM email_accounts
WHERE provider = 'microsoft';

-- ============================================
-- TROUBLESHOOTING STEPS
-- ============================================

/*
IF TOKEN IS EXPIRED OR INVALID:

Option 1: Force Token Refresh (will happen automatically on next sync)
  - The sync function will now automatically refresh tokens that are expired
    or expiring within 5 minutes
  - Just trigger a sync and check the terminal logs

Option 2: Manually Remove and Re-add Account
  1. Go to Settings → Email Accounts
  2. Click "Remove Account" for the Microsoft account
  3. Click "Add Account" → Microsoft
  4. Complete the OAuth flow again
  5. This will generate fresh tokens

Option 3: Update Token Expiry to Force Refresh
  -- This will make the token appear expired, forcing a refresh on next sync
  UPDATE email_accounts
  SET token_expires_at = NOW() - INTERVAL '1 hour'
  WHERE provider = 'microsoft'
    AND email_address = 'your-email@example.com'; -- Replace with your email

After any of these options, trigger a sync and watch the terminal for:
  - "🔄 Token expired or expiring soon, refreshing..."
  - "✅ Token refreshed successfully"
  - OR any errors like "❌ Token refresh failed"
*/

