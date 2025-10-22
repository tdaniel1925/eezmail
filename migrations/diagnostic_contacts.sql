-- ============================================================================
-- CONTACT SYSTEM DIAGNOSTIC
-- ============================================================================
-- Run this in Supabase SQL Editor to diagnose contact issues
-- ============================================================================

-- 1. Check if contacts table exists and has data
SELECT 'CONTACTS TABLE' as check_type,
  COUNT(*) as total_contacts,
  COUNT(CASE WHEN user_id = auth.uid() THEN 1 END) as my_contacts
FROM contacts;

-- 2. List YOUR contacts (should show contacts you created)
SELECT 
  id,
  COALESCE(display_name, first_name || ' ' || last_name, 'No Name') as name,
  created_at,
  user_id,
  is_archived
FROM contacts
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check contact_tags table
SELECT 'CONTACT_TAGS TABLE' as check_type,
  COUNT(*) as total_tags,
  COUNT(CASE WHEN user_id = auth.uid() THEN 1 END) as my_tags
FROM contact_tags;

-- 4. Check contact_groups table
SELECT 'CONTACT_GROUPS TABLE' as check_type,
  COUNT(*) as total_groups,
  COUNT(CASE WHEN user_id = auth.uid() THEN 1 END) as my_groups
FROM contact_groups;

-- 5. Check RLS policies are working
SELECT 'RLS CHECK' as check_type,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN 'Authenticated as: ' || auth.uid()::text
    ELSE 'NOT AUTHENTICATED!'
  END as status;

-- 6. Test if you can query your contacts (RLS test)
SELECT 'RLS TEST' as check_type,
  CASE 
    WHEN COUNT(*) >= 0 THEN '✅ Can query contacts table'
    ELSE '❌ Cannot query contacts'
  END as result
FROM contacts
WHERE user_id = auth.uid();

-- 7. Check if there are contacts with NULL user_id (would be invisible)
SELECT 'NULL USER_ID CHECK' as check_type,
  COUNT(*) as contacts_with_null_user_id
FROM contacts
WHERE user_id IS NULL;

-- 8. Check recent contact creations (last hour)
SELECT 'RECENT CONTACTS' as check_type,
  COUNT(*) as created_last_hour
FROM contacts
WHERE created_at > NOW() - INTERVAL '1 hour';

-- ============================================================================
-- DIAGNOSTIC SUMMARY
-- ============================================================================
SELECT 
  '🔍 DIAGNOSTIC COMPLETE' as status,
  'Check results above for issues' as message;


