-- ============================================================================
-- USERNAME-ONLY AUTHENTICATION MIGRATION
-- Creates usernames for all existing users and makes username required
-- Run this in Supabase SQL Editor FIRST before code changes
-- ============================================================================

-- Step 1: Generate usernames for users that don't have one
-- Formula: lowercase(full_name or email_prefix) + random suffix if needed
UPDATE users 
SET username = LOWER(
  REGEXP_REPLACE(
    COALESCE(
      full_name,
      SPLIT_PART(email, '@', 1)
    ),
    '[^a-z0-9_]', 
    '_', 
    'g'
  )
) || '_' || SUBSTRING(MD5(id::text) FROM 1 FOR 6)
WHERE username IS NULL OR username = '';

-- Step 2: Handle any duplicate usernames by adding sequential numbers
DO $$
DECLARE
  user_record RECORD;
  new_username TEXT;
  counter INT;
BEGIN
  FOR user_record IN 
    SELECT id, username 
    FROM users 
    WHERE username IN (
      SELECT username 
      FROM users 
      WHERE username IS NOT NULL
      GROUP BY username 
      HAVING COUNT(*) > 1
    )
    ORDER BY created_at
  LOOP
    counter := 1;
    new_username := user_record.username || '_' || counter;
    
    WHILE EXISTS (SELECT 1 FROM users WHERE username = new_username) LOOP
      counter := counter + 1;
      new_username := user_record.username || '_' || counter;
    END LOOP;
    
    UPDATE users 
    SET username = new_username 
    WHERE id = user_record.id;
    
    RAISE NOTICE 'Updated duplicate username for user %: %', user_record.id, new_username;
  END LOOP;
END $$;

-- Step 3: Make username column NOT NULL and ensure uniqueness
ALTER TABLE users 
ALTER COLUMN username SET NOT NULL;

-- Step 4: Ensure username is unique (if constraint doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_username_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
  END IF;
END $$;

-- Step 5: Create case-insensitive index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_users_username_lower 
ON users(LOWER(username));

-- Step 6: Create index on username for regular lookups
CREATE INDEX IF NOT EXISTS idx_users_username 
ON users(username);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check for any users without usernames (should be 0)
SELECT 
  'Users without username' as check_type,
  COUNT(*) as count
FROM users 
WHERE username IS NULL OR username = '';

-- Check for duplicate usernames (should be 0)
SELECT 
  'Duplicate usernames' as check_type,
  COUNT(*) as count
FROM (
  SELECT username, COUNT(*) as dup_count
  FROM users
  GROUP BY username
  HAVING COUNT(*) > 1
) dups;

-- Show all users with their usernames
SELECT 
  id,
  username,
  email,
  full_name,
  role,
  role_hierarchy,
  is_sandbox_user,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Username migration completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  - All users now have unique usernames';
  RAISE NOTICE '  - Username column is now NOT NULL';
  RAISE NOTICE '  - Indexes created for performance';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Review the user list above';
  RAISE NOTICE '  2. Deploy code changes for username-only auth';
  RAISE NOTICE '  3. Test login with usernames';
  RAISE NOTICE '';
END $$;

