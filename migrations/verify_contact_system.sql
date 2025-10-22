-- ============================================================================
-- CONTACT SYSTEM VERIFICATION SCRIPT
-- ============================================================================
-- Run this in Supabase SQL Editor AFTER running the migration
-- to verify everything is set up correctly
-- ============================================================================

-- 1. Verify all tables exist
SELECT 'TABLES CHECK' as test_category, 
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ PASS - All 4 tables exist'
    ELSE '❌ FAIL - Missing ' || (4 - COUNT(*))::text || ' tables'
  END as result
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'contact_groups',
  'contact_group_members',
  'contact_tags',
  'contact_tag_assignments'
);

-- 2. List all created tables with column counts
SELECT 
  '📋 ' || table_name as table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns,
  (SELECT COUNT(*) FROM information_schema.table_constraints 
   WHERE table_name = t.table_name AND constraint_type = 'PRIMARY KEY') as primary_keys,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.table_name) as indexes
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN (
  'contact_groups',
  'contact_group_members',
  'contact_tags',
  'contact_tag_assignments'
)
ORDER BY table_name;

-- 3. Verify RLS is enabled
SELECT 'RLS CHECK' as test_category,
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ PASS - RLS enabled on all tables'
    ELSE '⚠️ WARNING - RLS not enabled on ' || (4 - COUNT(*))::text || ' tables'
  END as result
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'contact_groups',
  'contact_group_members',
  'contact_tags',
  'contact_tag_assignments'
)
AND rowsecurity = true;

-- 4. Count RLS policies
SELECT 'POLICIES CHECK' as test_category,
  CASE 
    WHEN COUNT(*) >= 12 THEN '✅ PASS - ' || COUNT(*)::text || ' policies created'
    ELSE '⚠️ WARNING - Only ' || COUNT(*) ::text || ' policies (expected 12+)'
  END as result
FROM pg_policies
WHERE tablename IN (
  'contact_groups',
  'contact_group_members',
  'contact_tags',
  'contact_tag_assignments'
);

-- 5. List all policies
SELECT 
  '🔒 ' || tablename as table_name,
  policyname as policy_name,
  cmd as operation
FROM pg_policies
WHERE tablename IN (
  'contact_groups',
  'contact_group_members',
  'contact_tags',
  'contact_tag_assignments'
)
ORDER BY tablename, cmd;

-- 6. Verify views exist
SELECT 'VIEWS CHECK' as test_category,
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ PASS - Both views created'
    ELSE '⚠️ WARNING - Missing ' || (2 - COUNT(*))::text || ' views'
  END as result
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN (
  'contact_groups_with_counts',
  'contacts_with_groups_and_tags'
);

-- 7. Verify contacts table exists (prerequisite)
SELECT 'PREREQUISITES CHECK' as test_category,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables 
                 WHERE table_schema = 'public' AND table_name = 'contacts')
    THEN '✅ PASS - Contacts table exists'
    ELSE '❌ FAIL - Contacts table missing!'
  END as result;

-- 8. Check if current user can query (tests RLS)
SELECT 'AUTH CHECK' as test_category,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN '✅ PASS - User authenticated: ' || auth.uid()::text
    ELSE '⚠️ WARNING - Not authenticated (run from authenticated session)'
  END as result;

-- 9. Test insert permissions (will rollback)
DO $$
DECLARE
  can_insert BOOLEAN := FALSE;
BEGIN
  -- Try to create a test tag
  BEGIN
    INSERT INTO contact_tags (user_id, name, color)
    VALUES (auth.uid(), 'TEST_TAG_DELETE_ME', '#FF0000');
    can_insert := TRUE;
    -- Rollback test insert
    ROLLBACK;
  EXCEPTION WHEN OTHERS THEN
    can_insert := FALSE;
  END;
  
  IF can_insert THEN
    RAISE NOTICE '✅ PASS - Can insert into contact_tags';
  ELSE
    RAISE NOTICE '❌ FAIL - Cannot insert into contact_tags (check RLS policies)';
  END IF;
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================
SELECT 
  '🎯 VERIFICATION COMPLETE' as status,
  'Check results above' as message,
  'All checks should show ✅ PASS' as expected_result;

-- ============================================================================
-- QUICK MANUAL TESTS (Optional)
-- ============================================================================

-- Create a test tag (manual test)
-- Uncomment to run:
/*
INSERT INTO contact_tags (user_id, name, color)
VALUES (auth.uid(), 'Test Tag', '#10B981')
RETURNING *;
*/

-- Create a test group (manual test)
-- Uncomment to run:
/*
INSERT INTO contact_groups (user_id, name, description, color)
VALUES (auth.uid(), 'Test Group', 'A test group', '#3B82F6')
RETURNING *;
*/

-- View your tags
-- Uncomment to run:
/*
SELECT * FROM contact_tags WHERE user_id = auth.uid();
*/

-- View your groups
-- Uncomment to run:
/*
SELECT * FROM contact_groups WHERE user_id = auth.uid();
*/

-- View groups with counts
-- Uncomment to run:
/*
SELECT * FROM contact_groups_with_counts WHERE user_id = auth.uid();
*/

-- ============================================================================
-- CLEANUP TEST DATA (if you ran manual tests)
-- ============================================================================
-- Uncomment to run:
/*
DELETE FROM contact_tags WHERE user_id = auth.uid() AND name LIKE '%Test%';
DELETE FROM contact_groups WHERE user_id = auth.uid() AND name LIKE '%Test%';
*/


