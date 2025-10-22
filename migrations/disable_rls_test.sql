-- ============================================================================
-- TEMPORARY: DISABLE RLS ON CONTACTS FOR DEBUGGING
-- ============================================================================
-- WARNING: This makes contacts visible to everyone!
-- Only use this temporarily to test if RLS is the issue

-- Disable RLS
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS (run this after testing)
-- ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

SELECT '⚠️ RLS DISABLED ON CONTACTS TABLE - FOR TESTING ONLY' as warning;


