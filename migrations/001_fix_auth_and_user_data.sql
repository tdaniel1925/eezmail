-- =====================================================
-- CRITICAL AUTH FIX MIGRATION
-- Date: October 28, 2025
-- Purpose: Fix authentication and user data issues
-- =====================================================

-- 1. Add 'name' column if it doesn't exist
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='name'
    ) THEN
        ALTER TABLE users ADD COLUMN name TEXT;
        RAISE NOTICE '✅ Added name column';
    ELSE
        RAISE NOTICE '✓ name column already exists';
    END IF;
END $$;

-- 2. Populate name field from existing data
-- =====================================================
UPDATE users 
SET name = COALESCE(
    full_name,
    TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, ''))),
    email
)
WHERE name IS NULL OR name = '';

-- 3. Ensure all users have usernames
-- =====================================================
-- Check for users without usernames
DO $$
DECLARE
    missing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_count 
    FROM users 
    WHERE username IS NULL OR username = '';
    
    IF missing_count > 0 THEN
        RAISE NOTICE '⚠️  WARNING: % users missing usernames', missing_count;
        RAISE NOTICE '   Run this to auto-generate usernames:';
        RAISE NOTICE '   UPDATE users SET username = LOWER(SPLIT_PART(email, ''@'', 1)) WHERE username IS NULL;';
    ELSE
        RAISE NOTICE '✓ All users have usernames';
    END IF;
END $$;

-- 4. Create case-insensitive indexes for performance
-- =====================================================
DO $$
BEGIN
    -- Index on lowercase email for faster lookups
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' AND indexname = 'users_email_lower_idx'
    ) THEN
        CREATE INDEX users_email_lower_idx ON users (LOWER(email));
        RAISE NOTICE '✅ Created case-insensitive email index';
    ELSE
        RAISE NOTICE '✓ Email index already exists';
    END IF;
    
    -- Index on lowercase username for faster lookups
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'users' AND indexname = 'users_username_lower_idx'
    ) THEN
        CREATE INDEX users_username_lower_idx ON users (LOWER(username));
        RAISE NOTICE '✅ Created case-insensitive username index';
    ELSE
        RAISE NOTICE '✓ Username index already exists';
    END IF;
END $$;

-- 5. Show summary of user data
-- =====================================================
DO $$
DECLARE
    total_users INTEGER;
    users_with_names INTEGER;
    users_with_usernames INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM users;
    SELECT COUNT(*) INTO users_with_names FROM users WHERE name IS NOT NULL AND name != '';
    SELECT COUNT(*) INTO users_with_usernames FROM users WHERE username IS NOT NULL AND username != '';
    
    RAISE NOTICE '';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'MIGRATION SUMMARY';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Total users: %', total_users;
    RAISE NOTICE 'Users with names: % (%%%)', users_with_names, ROUND((users_with_names::NUMERIC / total_users * 100), 1);
    RAISE NOTICE 'Users with usernames: % (%%%)', users_with_usernames, ROUND((users_with_usernames::NUMERIC / total_users * 100), 1);
    RAISE NOTICE '=================================================';
END $$;

-- 6. Sample data verification
-- =====================================================
RAISE NOTICE '';
RAISE NOTICE 'Sample users:';
SELECT 
    email,
    username,
    name,
    role
FROM users 
LIMIT 5;

