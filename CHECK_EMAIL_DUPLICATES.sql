-- Check current email count and dates for Microsoft account
SELECT 
  ea.email_address,
  ea.provider,
  COUNT(e.id) as total_emails,
  MAX(e.received_at) as newest_email,
  MIN(e.received_at) as oldest_email,
  COUNT(DISTINCT e.folder_name) as folders_with_emails
FROM email_accounts ea
LEFT JOIN emails e ON e.account_id = ea.id
WHERE ea.provider = 'microsoft'
GROUP BY ea.id, ea.email_address, ea.provider;

-- Check if there are old emails blocking new inserts
SELECT 
  folder_name,
  COUNT(*) as count,
  MAX(received_at) as newest
FROM emails
WHERE account_id = (SELECT id FROM email_accounts WHERE provider = 'microsoft' LIMIT 1)
GROUP BY folder_name
ORDER BY count DESC
LIMIT 10;

