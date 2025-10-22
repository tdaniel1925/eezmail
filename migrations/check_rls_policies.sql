-- ============================================================================
-- CHECK RLS POLICIES ON CONTACTS TABLE
-- ============================================================================

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'contacts';

-- Check existing policies
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'contacts';

-- Try to select contacts directly (will show RLS in action)
SELECT 
  'DIRECT QUERY TEST' as test,
  COUNT(*) as count,
  array_agg(id) as contact_ids
FROM contacts;

-- Check if auth.uid() matches user_id
SELECT 
  'USER ID CHECK' as test,
  auth.uid() as current_user_id,
  (SELECT user_id FROM contacts LIMIT 1) as first_contact_user_id,
  (SELECT user_id FROM contacts LIMIT 1) = auth.uid() as ids_match;


