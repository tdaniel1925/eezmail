-- ============================================================================
-- CONTACT SYSTEM DIAGNOSTIC - SINGLE RESULT SET
-- ============================================================================
-- This version returns ALL diagnostics in ONE table for easy viewing
-- ============================================================================

SELECT 
  '1. TOTAL CONTACTS' as diagnostic_check,
  COUNT(*)::text as value,
  'Total contacts in database' as description
FROM contacts

UNION ALL

SELECT 
  '2. MY CONTACTS' as diagnostic_check,
  COUNT(*)::text as value,
  'Contacts owned by current user' as description
FROM contacts
WHERE user_id = auth.uid()

UNION ALL

SELECT 
  '3. MY CONTACT IDS' as diagnostic_check,
  string_agg(id::text, ', ') as value,
  'IDs of my contacts' as description
FROM (
  SELECT id FROM contacts WHERE user_id = auth.uid() LIMIT 5
) subquery

UNION ALL

SELECT 
  '4. MY CONTACT NAMES' as diagnostic_check,
  string_agg(COALESCE(display_name, first_name || ' ' || last_name, 'No Name'), ', ') as value,
  'Names of my contacts' as description
FROM (
  SELECT display_name, first_name, last_name FROM contacts WHERE user_id = auth.uid() LIMIT 5
) subquery

UNION ALL

SELECT 
  '5. TOTAL TAGS' as diagnostic_check,
  COUNT(*)::text as value,
  'Total tags in database' as description
FROM contact_tags

UNION ALL

SELECT 
  '6. MY TAGS' as diagnostic_check,
  COUNT(*)::text as value,
  'Tags owned by current user' as description
FROM contact_tags
WHERE user_id = auth.uid()

UNION ALL

SELECT 
  '7. TOTAL GROUPS' as diagnostic_check,
  COUNT(*)::text as value,
  'Total groups in database' as description
FROM contact_groups

UNION ALL

SELECT 
  '8. MY GROUPS' as diagnostic_check,
  COUNT(*)::text as value,
  'Groups owned by current user' as description
FROM contact_groups
WHERE user_id = auth.uid()

UNION ALL

SELECT 
  '9. AUTH USER ID' as diagnostic_check,
  COALESCE(auth.uid()::text, 'NOT AUTHENTICATED!') as value,
  'Current authenticated user ID' as description

UNION ALL

SELECT 
  '10. CONTACTS WITH NULL USER_ID' as diagnostic_check,
  COUNT(*)::text as value,
  'Contacts with no owner (ORPHANED)' as description
FROM contacts
WHERE user_id IS NULL

UNION ALL

SELECT 
  '11. RECENT CONTACTS (1 hour)' as diagnostic_check,
  COUNT(*)::text as value,
  'Contacts created in last hour' as description
FROM contacts
WHERE created_at > NOW() - INTERVAL '1 hour'

UNION ALL

SELECT 
  '12. ARCHIVED CONTACTS' as diagnostic_check,
  COUNT(*)::text as value,
  'My archived contacts (hidden)' as description
FROM contacts
WHERE user_id = auth.uid() AND is_archived = TRUE

ORDER BY diagnostic_check;


