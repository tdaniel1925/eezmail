-- Debug query to check email sender information
SELECT 
  id,
  subject,
  from_address,
  to_addresses,
  account_id,
  received_at,
  folder_name
FROM emails
WHERE subject LIKE '%alive%'
ORDER BY received_at DESC
LIMIT 3;

-- Also check the email account details
SELECT 
  id,
  email_address,
  provider,
  display_name
FROM email_accounts
WHERE id IN (
  SELECT account_id FROM emails WHERE subject LIKE '%alive%' LIMIT 1
);

