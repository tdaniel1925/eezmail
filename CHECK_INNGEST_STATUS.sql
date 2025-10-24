-- Check if Inngest sync is configured correctly

-- 1. Check account status
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

-- 2. Check email count
SELECT 
  COUNT(*) as total_emails,
  COUNT(DISTINCT account_id) as accounts_with_emails
FROM emails
WHERE account_id IN (
  SELECT id FROM email_accounts WHERE provider = 'microsoft'
);

-- 3. Check folder sync status
SELECT 
  name,
  message_count,
  unread_count,
  sync_status,
  sync_cursor IS NOT NULL as has_delta_link,
  last_sync_at
FROM email_folders
WHERE account_id IN (
  SELECT id FROM email_accounts WHERE provider = 'microsoft'
)
ORDER BY name;

-- 4. Sample of most recent emails (should be empty after DELETE)
SELECT 
  subject,
  from_address->>'email' as from_email,
  received_at,
  created_at,
  folder_name
FROM emails
WHERE account_id IN (
  SELECT id FROM email_accounts WHERE provider = 'microsoft'
)
ORDER BY received_at DESC
LIMIT 10;

