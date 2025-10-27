-- ============================================================================
-- ADD FIRST NAME & LAST NAME COLUMNS TO USERS TABLE
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Add first_name and last_name columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Step 2: Populate first_name and last_name from existing full_name
-- Split full_name into first and last parts
UPDATE users
SET 
  first_name = CASE 
    WHEN full_name IS NOT NULL AND full_name != '' THEN 
      TRIM(SPLIT_PART(full_name, ' ', 1))
    ELSE 
      TRIM(SPLIT_PART(email, '@', 1))
  END,
  last_name = CASE 
    WHEN full_name IS NOT NULL AND full_name != '' AND POSITION(' ' IN full_name) > 0 THEN 
      TRIM(SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1))
    ELSE 
      ''
  END
WHERE first_name IS NULL OR last_name IS NULL;

-- Step 3: Create indexes for first_name and last_name
CREATE INDEX IF NOT EXISTS idx_users_first_name ON users(first_name);
CREATE INDEX IF NOT EXISTS idx_users_last_name ON users(last_name);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that all users now have first_name and last_name
SELECT 
  'Users with first_name and last_name' as check_type,
  COUNT(*) as total_users,
  COUNT(first_name) as with_first_name,
  COUNT(last_name) as with_last_name
FROM users;

-- Sample of migrated names
SELECT 
  id,
  email,
  username,
  full_name,
  first_name,
  last_name,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- Verify columns exist
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('first_name', 'last_name', 'full_name')
ORDER BY column_name;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ First Name & Last Name columns added successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  ✅ first_name and last_name columns added';
  RAISE NOTICE '  ✅ Existing names split from full_name';
  RAISE NOTICE '  ✅ Indexes created for performance';
  RAISE NOTICE '  ✅ All users have first_name populated';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Review the verification results above';
  RAISE NOTICE '  2. Test signup with first/last name';
  RAISE NOTICE '  3. Test admin user creation';
  RAISE NOTICE '';
END $$;

