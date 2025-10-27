-- Migration 0013: Simplify email categories
-- Remove: unscreened, newsfeed, receipts, spam, archived, newsletter
-- Keep: inbox, sent, drafts, junk, outbox, deleted
-- Run this in Supabase SQL Editor

-- Step 1: Temporarily convert column to text to avoid enum constraints
ALTER TABLE emails ALTER COLUMN email_category TYPE TEXT;

-- Step 2: Map existing data to new categories (now we can use any text value)
UPDATE emails 
SET email_category = CASE
  WHEN email_category = 'spam' THEN 'junk'
  WHEN email_category IN ('unscreened', 'newsfeed', 'receipts', 'archived', 'newsletter') THEN 'inbox'
  ELSE email_category
END;

-- Step 3: Drop the old enum type
DROP TYPE IF EXISTS email_category CASCADE;

-- Step 4: Create the new simplified enum
CREATE TYPE email_category AS ENUM ('inbox', 'sent', 'drafts', 'junk', 'outbox', 'deleted');

-- Step 5: Convert the column back to the new enum type
ALTER TABLE emails 
ALTER COLUMN email_category TYPE email_category 
USING email_category::email_category;

-- Step 6: Verify the change
SELECT DISTINCT email_category FROM emails ORDER BY email_category;

