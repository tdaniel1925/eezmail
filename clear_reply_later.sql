-- Clear Reply Later Data
-- This script safely clears all reply_later_until timestamps from emails

-- Clear all reply later data
UPDATE emails 
SET 
  reply_later_until = NULL,
  reply_later_note = NULL,
  updated_at = NOW()
WHERE reply_later_until IS NOT NULL;

-- Show count of cleared emails
SELECT COUNT(*) as cleared_count 
FROM emails 
WHERE reply_later_until IS NULL;

-- Verify no emails have reply_later_until set
SELECT COUNT(*) as remaining_reply_later_emails 
FROM emails 
WHERE reply_later_until IS NOT NULL;

