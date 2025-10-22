-- ============================================================================
-- DIRECT QUERY TEST - NO RLS, NO FILTERS
-- ============================================================================

-- Test 1: Can we see ALL contacts now?
SELECT 
  'TEST 1: ALL CONTACTS' as test,
  COUNT(*) as total_count
FROM contacts;

-- Test 2: Can we see contacts with specific user_id?
SELECT 
  'TEST 2: CONTACTS FOR USER bc958faa-efe4-4136-9882-789d9b161c6a' as test,
  COUNT(*) as count_for_user
FROM contacts
WHERE user_id = 'bc958faa-efe4-4136-9882-789d9b161c6a';

-- Test 3: List all contacts with details
SELECT 
  id,
  user_id,
  COALESCE(display_name, first_name || ' ' || last_name, 'No Name') as name,
  is_archived,
  created_at
FROM contacts
WHERE user_id = 'bc958faa-efe4-4136-9882-789d9b161c6a'
ORDER BY created_at DESC;

-- Test 4: Check if is_archived is blocking
SELECT 
  'TEST 4: ARCHIVED STATUS' as test,
  is_archived,
  COUNT(*) as count
FROM contacts
GROUP BY is_archived;


