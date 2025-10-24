-- FIX SENT EMAIL CATEGORIES
-- This will re-categorize all existing sent/drafts/trash emails correctly

-- Re-categorize sent emails to 'archived'
UPDATE emails
SET email_category = 'archived'
WHERE folder_name IN ('sent', 'sentitems', 'Sent Items')
  AND account_id = '26ddbb0d-12f4-422b-8a33-fd1e8072e33c'; -- Replace with your account ID

-- Re-categorize drafts to 'unscreened'
UPDATE emails
SET email_category = 'unscreened'
WHERE folder_name = 'drafts'
  AND account_id = '26ddbb0d-12f4-422b-8a33-fd1e8072e33c';

-- Re-categorize trash/deleted to 'archived'
UPDATE emails
SET email_category = 'archived'
WHERE folder_name IN ('trash', 'deleteditems', 'deleted', 'Deleted Items')
  AND account_id = '26ddbb0d-12f4-422b-8a33-fd1e8072e33c';

-- Verify the changes
SELECT
  folder_name,
  email_category,
  COUNT(*) as email_count
FROM emails
WHERE account_id = '26ddbb0d-12f4-422b-8a33-fd1e8072e33c'
GROUP BY folder_name, email_category
ORDER BY folder_name;

SELECT '✅ Email categories fixed! Sent emails are no longer in inbox category.' as status_message;

