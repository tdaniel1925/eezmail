-- ============================================================================
-- SIMPLE TEST - Just count contacts for your user
-- ============================================================================

-- This is exactly what the Drizzle query should be doing
SELECT COUNT(*) as contact_count
FROM contacts
WHERE user_id = 'bc958faa-efe4-4136-9882-789d9b161c6a'
  AND is_archived = false;

-- Show the actual contacts
SELECT 
  id,
  first_name,
  last_name,
  display_name,
  user_id,
  is_archived,
  created_at
FROM contacts
WHERE user_id = 'bc958faa-efe4-4136-9882-789d9b161c6a'
  AND is_archived = false
ORDER BY created_at DESC;


